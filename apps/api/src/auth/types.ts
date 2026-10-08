export interface AccessTokenPayload {
  sub: string;
  email: string;
  jti?: string;
}

export interface RequestUser {
  userId: string;
  email: string;
}
