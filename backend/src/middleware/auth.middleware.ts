import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../lib/prisma';
import { apiLog, log } from '../lib/logger';
import {
  AuthRejectionReason,
  parseAuthTokenPayload,
  validateLiveAuthIdentity,
} from '../lib/auth-token';
import { AuthenticatedRequest } from '../types';

type RuntimeAuthRejectionReason =
  | AuthRejectionReason
  | 'invalid_or_expired_token'
  | 'identity_lookup_failed'
  | 'admin_role_required';

function decodedUserId(decoded: unknown): string | undefined {
  if (typeof decoded !== 'object' || decoded === null) return undefined;
  const userId = (decoded as { userId?: unknown }).userId;
  return typeof userId === 'string' ? userId : undefined;
}

function logAuthenticationRejection(
  reason: RuntimeAuthRejectionReason,
  userId: string | undefined,
  optional: boolean
): void {
  const details = {
    ...(userId ? { userId } : {}),
    reason,
  };

  if (optional) {
    log('debug', 'API', 'Optional authentication ignored', details);
  } else {
    apiLog.warn('Authentication rejected', details);
  }
}

async function loadLiveIdentity(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(authHeader.substring(7), config.JWT_SECRET);
  } catch {
    logAuthenticationRejection('invalid_or_expired_token', undefined, false);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const parsed = parseAuthTokenPayload(decoded, 'access');
  if (parsed.valid === false) {
    logAuthenticationRejection(parsed.reason, decodedUserId(decoded), false);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  let user: Awaited<ReturnType<typeof loadLiveIdentity>>;
  try {
    user = await loadLiveIdentity(parsed.payload.userId);
  } catch {
    logAuthenticationRejection('identity_lookup_failed', parsed.payload.userId, false);
    return res.status(503).json({ error: 'Authentication temporarily unavailable' });
  }

  const identity = validateLiveAuthIdentity(parsed.payload, user);
  if (identity.valid === false) {
    logAuthenticationRejection(identity.reason, parsed.payload.userId, false);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = identity.identity;
  next();
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    logAuthenticationRejection('admin_role_required', req.user?.userId, false);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export { adminMiddleware as requireAdmin, authMiddleware as authenticate };

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(authHeader.substring(7), config.JWT_SECRET);
  } catch {
    logAuthenticationRejection('invalid_or_expired_token', undefined, true);
    next();
    return;
  }

  const parsed = parseAuthTokenPayload(decoded, 'access');
  if (parsed.valid === false) {
    logAuthenticationRejection(parsed.reason, decodedUserId(decoded), true);
    next();
    return;
  }

  try {
    const user = await loadLiveIdentity(parsed.payload.userId);
    const identity = validateLiveAuthIdentity(parsed.payload, user);
    if (identity.valid === true) {
      req.user = identity.identity;
    } else {
      logAuthenticationRejection(identity.reason, parsed.payload.userId, true);
    }
  } catch {
    logAuthenticationRejection('identity_lookup_failed', parsed.payload.userId, true);
  }

  next();
};
