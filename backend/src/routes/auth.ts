import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../lib/prisma';
import { success, error } from '../utils/response';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateUserSchema,
} from '../schemas';
import { loginTracker } from '../lib/login-tracker';
import { validatePassword, getPasswordStrengthDescription } from '../lib/password-validator';
import {
  createAccessToken,
  createAuthTokens,
  parseAuthTokenPayload,
  validateLiveAuthIdentity,
} from '../lib/auth-token';
import { apiLog } from '../lib/logger';

const router = Router();

// 用户注册
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return error(
        res,
        `密码强度不足：${passwordValidation.errors.join('，')}`,
        400,
        {
          strength: passwordValidation.strength,
          errors: passwordValidation.errors,
        }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return error(res, '用户名或邮箱已被注册', 409);
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
        role: 'USER',
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    const { token, refreshToken } = createAuthTokens(user);

    return success(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
      passwordStrength: {
        level: passwordValidation.strength,
        description: getPasswordStrengthDescription(passwordValidation.strength),
      },
    }, '注册成功', undefined, 201);
  } catch (err: any) {
    console.error('注册错误:', err);
    return error(res, err.message, 500);
  }
});

// 用户登录
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // 检查是否被锁定
    const lockCheck = loginTracker.checkLock(username);
    if (lockCheck.locked) {
      const remainingMinutes = Math.ceil(lockCheck.remainingTime / 60000);
      return error(
        res,
        `账户已锁定，请 ${remainingMinutes} 分钟后再试`,
        423,
        { lockUntil: lockCheck.lockUntil, remainingTime: lockCheck.remainingTime }
      );
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      // 记录失败尝试
      const failureResult = loginTracker.recordFailure(username);
      return error(
        res,
        failureResult.locked
          ? `登录失败次数过多，请15分钟后再试`
          : `用户名或密码错误，剩余尝试次数：${failureResult.remainingAttempts}`,
        401,
        { remainingAttempts: failureResult.remainingAttempts }
      );
    }

    // 检查账户是否被禁用
    if (!user.isActive) {
      return error(res, '账户已被禁用', 403);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // 记录失败尝试
      const failureResult = loginTracker.recordFailure(username);
      return error(
        res,
        failureResult.locked
          ? `登录失败次数过多，请15分钟后再试`
          : `用户名或密码错误，剩余尝试次数：${failureResult.remainingAttempts}`,
        401,
        { remainingAttempts: failureResult.remainingAttempts }
      );
    }

    // 登录成功，清除失败记录
    loginTracker.recordSuccess(username);

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token, refreshToken } = createAuthTokens(user);

    return success(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    }, '登录成功');
  } catch (err: any) {
    console.error('登录错误:', err);
    return error(res, err.message, 500);
  }
});

// 刷新 Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, '刷新令牌不能为空', 400);
    }

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const parsed = parseAuthTokenPayload(decoded, 'refresh');
    if (parsed.valid === false) {
      const claimedUserId = typeof decoded === 'object' && decoded !== null &&
        typeof (decoded as { userId?: unknown }).userId === 'string'
        ? (decoded as { userId: string }).userId
        : undefined;
      apiLog.warn('Refresh token rejected', {
        ...(claimedUserId ? { userId: claimedUserId } : {}),
        reason: parsed.reason,
      });
      return error(res, '无效的刷新令牌', 401);
    }

    // 检查用户是否存在且未被禁用
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: parsed.payload.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          tokenVersion: true,
        },
      });
    } catch {
      apiLog.warn('Refresh token rejected', {
        userId: parsed.payload.userId,
        reason: 'identity_lookup_failed',
      });
      return error(res, '认证服务暂时不可用', 503);
    }

    const identity = validateLiveAuthIdentity(parsed.payload, user);
    if (identity.valid === false) {
      apiLog.warn('Refresh token rejected', {
        userId: parsed.payload.userId,
        reason: identity.reason,
      });
      return error(res, '无效的刷新令牌', 401);
    }

    // 生成新的访问令牌
    const newToken = createAccessToken(user);

    return success(res, { token: newToken }, '令牌刷新成功');
  } catch (err: any) {
    apiLog.warn('Refresh token rejected', {
      reason: err.name === 'TokenExpiredError' ? 'expired_token' : 'invalid_token',
    });
    if (err.name === 'TokenExpiredError') {
      return error(res, '刷新令牌已过期，请重新登录', 401);
    }
    return error(res, '无效的刷新令牌', 401);
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        github: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    return success(res, user);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// 更新用户信息
router.put('/me', authenticate, validateBody(updateUserSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { displayName, bio, location, website, github, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        bio,
        location,
        website,
        github,
        avatar,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        github: true,
      },
    });

    return success(res, user, '用户信息更新成功');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// 修改密码
router.put('/password', authenticate, validateBody(updatePasswordSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 验证原密码
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return error(res, '原密码错误', 401);
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    apiLog.info('User sessions revoked', { userId, reason: 'password_changed' });

    return success(res, undefined, '密码修改成功，请重新登录');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    apiLog.info('User sessions revoked', { userId, reason: 'logout' });
    return success(res, undefined, '退出登录成功');
  } catch {
    return error(res, '退出登录失败', 500);
  }
});

export default router;
