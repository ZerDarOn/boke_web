// 登录失败跟踪器
export class LoginAttemptTracker {
  private attempts: Map<string, { count: number; lockUntil: number }> = new Map();
  private readonly maxAttempts: number = 5;  // 最大失败次数
  private readonly lockDuration: number = 15 * 60 * 1000;  // 锁定15分钟

  /**
   * 记录登录失败
   * @param identifier 用户标识（用户名、邮箱、IP）
   * @returns { locked: boolean, remainingAttempts: number, lockUntil: number }
   */
  recordFailure(identifier: string): {
    locked: boolean;
    remainingAttempts: number;
    lockUntil: number | null;
  } {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      // 首次失败
      this.attempts.set(identifier, {
        count: 1,
        lockUntil: 0,
      });
      return {
        locked: false,
        remainingAttempts: this.maxAttempts - 1,
        lockUntil: null,
      };
    }

    // 检查是否已锁定
    if (attempt.lockUntil > now) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockUntil: attempt.lockUntil,
      };
    }

    // 增加失败计数
    attempt.count += 1;

    // 检查是否达到最大失败次数
    if (attempt.count >= this.maxAttempts) {
      attempt.lockUntil = now + this.lockDuration;
      this.attempts.set(identifier, attempt);
      return {
        locked: true,
        remainingAttempts: 0,
        lockUntil: attempt.lockUntil,
      };
    }

    // 更新尝试记录
    this.attempts.set(identifier, attempt);
    return {
      locked: false,
      remainingAttempts: this.maxAttempts - attempt.count,
      lockUntil: null,
    };
  }

  /**
   * 记录成功登录，清除失败记录
   * @param identifier 用户标识
   */
  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * 检查是否被锁定
   * @param identifier 用户标识
   * @returns { locked: boolean, lockUntil: number | null, remainingTime: number }
   */
  checkLock(identifier: string): {
    locked: boolean;
    lockUntil: number | null;
    remainingTime: number;
  } {
    const attempt = this.attempts.get(identifier);
    if (!attempt) {
      return { locked: false, lockUntil: null, remainingTime: 0 };
    }

    const now = Date.now();
    if (attempt.lockUntil > now) {
      return {
        locked: true,
        lockUntil: attempt.lockUntil,
        remainingTime: attempt.lockUntil - now,
      };
    }

    // 锁定已过期
    if (attempt.lockUntil > 0) {
      attempt.lockUntil = 0;
      this.attempts.set(identifier, attempt);
    }

    return {
      locked: false,
      lockUntil: null,
      remainingTime: 0,
    };
  }

  /**
   * 重置用户失败记录（解锁）
   * @param identifier 用户标识
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * 获取剩余尝试次数
   * @param identifier 用户标识
   * @returns 剩余尝试次数
   */
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) {
      return this.maxAttempts;
    }

    const now = Date.now();
    if (attempt.lockUntil > now) {
      return 0;
    }

    return this.maxAttempts - attempt.count;
  }

  /**
   * 清理过期的记录
   */
  cleanup(): void {
    const now = Date.now();
    const expiration = now + 30 * 60 * 1000;  // 30分钟前

    for (const [key, value] of this.attempts.entries()) {
      if (value.lockUntil < expiration && value.count === 0) {
        this.attempts.delete(key);
      }
    }
  }
}

// 创建全局实例
export const loginTracker = new LoginAttemptTracker();

// 定期清理过期记录
setInterval(() => {
  loginTracker.cleanup();
}, 60 * 60 * 1000);  // 每小时清理一次
