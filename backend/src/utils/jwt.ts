import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;   // Ship 1A: multi-tenancy — optional so old tokens still validate
  act?: {                            // Ship 5B: super-admin impersonation
    userId: string;                  // the SUPERADMIN who initiated the impersonation
    email:  string;
  } | null;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
