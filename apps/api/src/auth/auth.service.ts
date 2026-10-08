import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { UsersService, SafeUser } from '../users/users.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  refreshTokenRedisKey,
} from './auth.constants';
import { AccessTokenPayload } from './types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(user: SafeUser): Promise<AuthTokens> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      },
    );

    await this.redis.set(
      refreshTokenRedisKey(user.id),
      this.hashToken(refreshToken),
      'EX',
      REFRESH_TOKEN_TTL_SECONDS,
    );

    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, name?: string): Promise<AuthTokens> {
    const user = await this.usersService.create(email, password, name);
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.usersService.verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Validates and rotates a refresh token. Rotation invalidates the
   * presented token immediately, so a stolen-but-already-used token
   * cannot be replayed.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const storedHash = await this.redis.get(refreshTokenRedisKey(payload.sub));
    if (!storedHash || storedHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(refreshTokenRedisKey(userId));
  }
}
