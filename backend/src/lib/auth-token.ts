import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { AuthPayload } from '../types';

export type AuthTokenType = 'access' | 'refresh';
export type AuthRejectionReason =
  | 'invalid_claims'
  | 'invalid_token_type'
  | 'user_not_found'
  | 'inactive_user'
  | 'token_revoked'
  | 'role_changed';

interface AuthTokenUser {
  id: string;
  role: AuthPayload['role'];
  tokenVersion: number;
}

interface LiveAuthUser extends AuthTokenUser {
  isActive: boolean;
}

type ParsedAuthToken =
  | { valid: true; payload: AuthPayload }
  | { valid: false; reason: 'invalid_claims' | 'invalid_token_type' };

export type LiveAuthIdentityResult =
  | { valid: true; identity: AuthPayload }
  | { valid: false; reason: Exclude<AuthRejectionReason, 'invalid_claims' | 'invalid_token_type'> };

const VALID_ROLES = new Set<AuthPayload['role']>(['USER', 'ADMIN', 'EDITOR']);
const ACCESS_TOKEN_TTL: jwt.SignOptions['expiresIn'] = '7d';
const REFRESH_TOKEN_TTL: jwt.SignOptions['expiresIn'] = '30d';

export function parseAuthTokenPayload(
  decoded: unknown,
  expectedType: AuthTokenType
): ParsedAuthToken {
  if (typeof decoded !== 'object' || decoded === null) {
    return { valid: false, reason: 'invalid_claims' };
  }

  const candidate = decoded as Partial<AuthPayload>;
  if (candidate.type !== expectedType) {
    return { valid: false, reason: 'invalid_token_type' };
  }

  if (
    typeof candidate.userId !== 'string' ||
    candidate.userId.length === 0 ||
    !VALID_ROLES.has(candidate.role as AuthPayload['role']) ||
    !Number.isInteger(candidate.tokenVersion) ||
    (candidate.tokenVersion as number) < 0
  ) {
    return { valid: false, reason: 'invalid_claims' };
  }

  return {
    valid: true,
    payload: {
      userId: candidate.userId,
      role: candidate.role as AuthPayload['role'],
      tokenVersion: candidate.tokenVersion as number,
      type: candidate.type,
    },
  };
}

export function validateLiveAuthIdentity(
  payload: AuthPayload,
  user: LiveAuthUser | null
): LiveAuthIdentityResult {
  if (!user || user.id !== payload.userId) {
    return { valid: false, reason: 'user_not_found' };
  }
  if (!user.isActive) {
    return { valid: false, reason: 'inactive_user' };
  }
  if (user.tokenVersion !== payload.tokenVersion) {
    return { valid: false, reason: 'token_revoked' };
  }
  if (user.role !== payload.role) {
    return { valid: false, reason: 'role_changed' };
  }

  return {
    valid: true,
    identity: {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: payload.type,
    },
  };
}

function signAuthToken(user: AuthTokenUser, type: AuthTokenType, expiresIn: jwt.SignOptions['expiresIn']): string {
  const payload: AuthPayload = {
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
    type,
  };

  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
}

export function createAccessToken(user: AuthTokenUser): string {
  return signAuthToken(user, 'access', ACCESS_TOKEN_TTL);
}

export function createRefreshToken(user: AuthTokenUser): string {
  return signAuthToken(user, 'refresh', REFRESH_TOKEN_TTL);
}

export function createAuthTokens(user: AuthTokenUser): {
  token: string;
  refreshToken: string;
} {
  return {
    token: createAccessToken(user),
    refreshToken: createRefreshToken(user),
  };
}
