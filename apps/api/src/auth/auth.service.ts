import { messages } from '../content/auth-auth.service';
import { runtimeEnvironment } from '../config/runtime-environment';
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

import type { AuthTokens } from './token-types';
export type { AuthTokens } from './token-types';

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

  private async issueTokens(user: SafeUser, expectedHash?: string): Promise<AuthTokens> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: runtimeEnvironment().jwtSecret,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: runtimeEnvironment().jwtRefreshSecret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      },
    );

    if (expectedHash === undefined) {
      await this.redis.set(
        refreshTokenRedisKey(user.id),
        this.hashToken(refreshToken),
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      );
    } else {
      const rotated = await this.redis.eval(
        'if redis.call("GET", KEYS[1]) == ARGV[1] then redis.call("SET", KEYS[1], ARGV[2], "EX", ARGV[3]); return 1 else return 0 end',
        1,
        refreshTokenRedisKey(user.id),
        expectedHash,
        this.hashToken(refreshToken),
        REFRESH_TOKEN_TTL_SECONDS,
      );
      if (rotated !== 1) throw new UnauthorizedException(messages.refreshTokenHasBeenRevoked);
    }

    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, name?: string): Promise<AuthTokens> {
    const user = await this.usersService.create(email, password, name);
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(messages.invalidEmailOrPassword);
    }

    const passwordMatches = await this.usersService.verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(messages.invalidEmailOrPassword);
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
        secret: runtimeEnvironment().jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException(messages.invalidOrExpiredRefreshToken);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(messages.userNoLongerExists);
    }

    return this.issueTokens(user, this.hashToken(refreshToken));
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(refreshTokenRedisKey(userId));
  }
}
