import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService, SafeUser } from '../users/users.service';
import { refreshTokenRedisKey } from './auth.constants';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

describe('AuthService', () => {
  const user: SafeUser = {
    id: 'user-1',
    email: 'jane@example.com',
    name: 'Jane',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let usersService: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail' | 'findById' | 'verifyPassword'>>;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let authService: AuthService;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      verifyPassword: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as any,
      redis as any,
    );
  });

  describe('register', () => {
    it('creates the user and issues a token pair', async () => {
      usersService.create.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const tokens = await authService.register(user.email, 'password123', user.name!);

      expect(usersService.create).toHaveBeenCalledWith(user.email, 'password123', user.name);
      expect(tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      expect(redis.set).toHaveBeenCalledWith(
        refreshTokenRedisKey(user.id),
        hash('refresh-token'),
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login('missing@example.com', 'password')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an incorrect password', async () => {
      usersService.findByEmail.mockResolvedValue({ ...user, passwordHash: 'hash' } as any);
      usersService.verifyPassword.mockResolvedValue(false);

      await expect(authService.login(user.email, 'wrong-password')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('issues a token pair for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue({ ...user, passwordHash: 'hash' } as any);
      usersService.verifyPassword.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const tokens = await authService.login(user.email, 'correct-password');

      expect(tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('refresh', () => {
    it('rejects an invalid/expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(authService.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a token that does not match the stored hash (already rotated)', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id, email: user.email });
      redis.get.mockResolvedValue(hash('some-other-token'));

      await expect(authService.refresh('stale-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the user no longer exists', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id, email: user.email });
      redis.get.mockResolvedValue(hash('current-token'));
      usersService.findById.mockResolvedValue(null);

      await expect(authService.refresh('current-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rotates and issues a new token pair on success', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id, email: user.email });
      redis.get.mockResolvedValue(hash('current-token'));
      usersService.findById.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const tokens = await authService.refresh('current-token');

      expect(tokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(redis.set).toHaveBeenCalledWith(
        refreshTokenRedisKey(user.id),
        hash('new-refresh-token'),
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('logout', () => {
    it('deletes the stored refresh token', async () => {
      await authService.logout(user.id);

      expect(redis.del).toHaveBeenCalledWith(refreshTokenRedisKey(user.id));
    });
  });
});
