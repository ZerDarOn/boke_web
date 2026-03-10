import { z } from 'zod';

/**
 * 密码强度要求
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;  // 0-4
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  errors: string[];
}

/**
 * 密码验证配置
 */
const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,  // 要求小写字母
  requireUppercase: true,  // 要求大写字母
  requireNumbers: true,  // 要求数字
  requireSpecialChars: false,  // 不要求特殊字符（可选）
  commonPasswords: ['password', '123456', 'qwerty', 'abc123', 'admin', 'welcome'],  // 常见弱密码
};

/**
 * 验证密码强度
 */
export function validatePassword(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`密码长度至少为 ${PASSWORD_CONFIG.minLength} 位`);
  } else if (password.length < 10) {
    score += 1;
  } else if (password.length < 14) {
    score += 2;
  } else {
    score += 3;
  }

  // 包含小写字母
  if (PASSWORD_CONFIG.requireLowercase) {
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    } else {
      score += 1;
    }
  }

  // 包含大写字母
  if (PASSWORD_CONFIG.requireUppercase) {
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    } else {
      score += 1;
    }
  }

  // 包含数字
  if (PASSWORD_CONFIG.requireNumbers) {
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    } else {
      score += 1;
    }
  }

  // 包含特殊字符（可选）
  if (PASSWORD_CONFIG.requireSpecialChars) {
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    } else {
      score += 1;
    }
  }

  // 检查常见弱密码
  const lowerPassword = password.toLowerCase();
  if (PASSWORD_CONFIG.commonPasswords.some(weak => lowerPassword.includes(weak))) {
    errors.push('密码过于简单，请使用更复杂的密码');
    score = Math.max(0, score - 2);
  }

  // 检查密码长度上限
  if (password.length > PASSWORD_CONFIG.maxLength) {
    errors.push(`密码长度不能超过 ${PASSWORD_CONFIG.maxLength} 位`);
    score = 0;
  }

  // 计算强度等级
  let strength: PasswordStrengthResult['strength'];
  if (score <= 1) {
    strength = 'very-weak';
  } else if (score === 2) {
    strength = 'weak';
  } else if (score === 3) {
    strength = 'fair';
  } else if (score === 4) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 4),
    strength,
    errors,
  };
}

/**
 * Zod 密码验证 Schema
 */
export const passwordSchema = z.string()
  .min(PASSWORD_CONFIG.minLength, `密码长度至少为 ${PASSWORD_CONFIG.minLength} 位`)
  .max(PASSWORD_CONFIG.maxLength, `密码长度不能超过 ${PASSWORD_CONFIG.maxLength} 位`)
  .refine((password) => {
    const result = validatePassword(password);
    return result.isValid;
  }, {
    message: '密码强度不足',
  });

/**
 * Zod 注册 Schema（包含密码验证）
 */
export const secureRegisterSchema = z.object({
  username: z.string()
    .min(3, '用户名至少为 3 个字符')
    .max(50, '用户名不能超过 50 个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('请输入有效的邮箱地址')
    .max(100, '邮箱地址不能超过 100 个字符'),
  password: passwordSchema,
  displayName: z.string()
    .min(1, '显示名称不能为空')
    .max(100, '显示名称不能超过 100 个字符')
    .optional(),
});

/**
 * Zod 密码更新 Schema
 */
export const secureUpdatePasswordSchema = z.object({
  oldPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: passwordSchema,
});

/**
 * 获取密码强度描述
 */
export function getPasswordStrengthDescription(strength: PasswordStrengthResult['strength']): string {
  const descriptions = {
    'very-weak': '非常弱',
    'weak': '弱',
    'fair': '一般',
    'strong': '强',
    'very-strong': '非常强',
  };
  return descriptions[strength];
}

/**
 * 获取密码强度百分比
 */
export function getPasswordStrengthPercentage(strength: PasswordStrengthResult['strength']): number {
  const percentages = {
    'very-weak': 20,
    'weak': 40,
    'fair': 60,
    'strong': 80,
    'very-strong': 100,
  };
  return percentages[strength];
}

/**
 * 获取密码强度颜色类名（Tailwind CSS）
 */
export function getPasswordStrengthColor(strength: PasswordStrengthResult['strength']): string {
  const colors = {
    'very-weak': 'bg-red-500',
    'weak': 'bg-orange-500',
    'fair': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-500',
  };
  return colors[strength];
}

/**
 * 获取密码改进建议
 */
export function getPasswordImprovementSuggestions(password: string): string[] {
  const suggestions: string[] = [];
  const result = validatePassword(password);

  if (!PASSWORD_CONFIG.requireLowercase || /[a-z]/.test(password)) {
    suggestions.push('添加小写字母');
  }
  if (!PASSWORD_CONFIG.requireUppercase || /[A-Z]/.test(password)) {
    suggestions.push('添加大写字母');
  }
  if (!PASSWORD_CONFIG.requireNumbers || /\d/.test(password)) {
    suggestions.push('添加数字');
  }
  if (!PASSWORD_CONFIG.requireSpecialChars || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    suggestions.push('添加特殊字符');
  }
  if (password.length < 12) {
    suggestions.push('增加密码长度（建议 12 位以上）');
  }
  if (result.score < 3) {
    suggestions.push('避免使用常见密码或简单模式');
  }

  return suggestions;
}

/**
 * 检查密码是否在常见密码列表中
 */
export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return PASSWORD_CONFIG.commonPasswords.some(weak => lowerPassword.includes(weak));
}
