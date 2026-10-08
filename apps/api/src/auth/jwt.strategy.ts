import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AccessTokenPayload, RequestUser } from './types';

function extractFromCookie(req: Request): string | null {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: AccessTokenPayload): RequestUser {
    return { userId: payload.sub, email: payload.email };
  }
}
