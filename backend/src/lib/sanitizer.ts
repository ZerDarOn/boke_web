import { Request, Response, NextFunction } from 'express';

/**
 * 输入净化中间件 — defense-in-depth 层
 *
 * ⚠️ 安全职责边界：
 *   - SQL 注入主防线：Prisma ORM（参数化查询）
 *   - XSS 主防线：CSP + Helmet + React 自动转义
 *   - 本模块：辅助层，清理明显的危险模式，不替代主防线
 *
 * 注意：以下 SQL 注入正则属黑名单模式，不防编码绕过（如 unicode escape）。
 * 不依赖它作为主防线，仅用于日志告警和辅助拦截。
 */

/**
 * 危险的 HTML 标签（XSS 攻击常用）
 */
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
  'button', 'select', 'option', 'style', 'link', 'meta', 'html', 'body',
];

/**
 * 危险的 HTML 属性（可用于 XSS 攻击）
 */
const DANGEROUS_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
  'onfocus', 'onblur', 'onchange', 'onsubmit',
  'javascript:', 'data:', 'vbscript:',
];

/**
 * SQL 注入常见模式
 */
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(union|select|insert|update|delete|drop|alter|create|exec|execute)/i,
  /(\s|^)(--|;|\/\*|\*\/|xp_|sp_|declare)/i,
  /(\s|^)(or\s+1\s*=\s*1|and\s+1\s*=\s*1)/i,
];

/**
 * 命令注入常见模式
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/,
  /\|\|/,
];

/**
 * 清理字符串输入（移除危险的 HTML 和特殊字符）
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 移除 HTML 标签
  let sanitized = input;

  // 移除危险的 HTML 标签
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // 移除危险的 HTML 属性
  DANGEROUS_ATTRIBUTES.forEach(attr => {
    const regex = new RegExp(`${attr}\\s*=`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // 移除 JavaScript 和 data: 协议
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // 移除 HTML 实体编码
  sanitized = sanitized.replace(/&#(\d+);/g, (match, code) => {
    const charCode = parseInt(code);
    return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '';
  });

  return sanitized.trim();
}

/**
 * 验证输入是否包含 SQL 注入模式
 */
export function containsSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * 验证输入是否包含命令注入模式
 */
export function containsCommandInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL 格式
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证用户名格式
 */
export function isValidUsername(username: string): boolean {
  // 只允许字母、数字、下划线和连字符
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * 净化 HTML 内容（用于 Markdown 内容）
 */
export function sanitizeHTML(html: string): string {
  // 移除脚本标签
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // 移除事件处理器
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

/**
 * 清理对象中的字符串字段
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  // 数组：逐项净化字符串，保持数组类型
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (item !== null && typeof item === 'object') {
        return sanitizeObject(item);
      }
      return item;
    }) as unknown as T;
  }

  const sanitized: Record<string, any> = { ...obj };

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      // 数组：逐项净化，保持数组类型
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (item !== null && typeof item === 'object') {
          return sanitizeObject(item);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized as T;
}

/**
 * 净理请求数据
 */
export function sanitizeRequestData(req: Request): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
}

/**
 * 验证输入长度
 */
export function validateLength(input: string, min: number, max: number): boolean {
  const length = input.trim().length;
  return length >= min && length <= max;
}

/**
 * 输入验证和净化中间件
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 验证 Content-Type
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
      // 文件上传，跳过净化
      return next();
    }

    // 净化输入数据（移除危险 HTML 标签/属性等）
    sanitizeRequestData(req);

    // 注:已移除"SQL/命令注入"全量正则扫描。
    // 原正则(如 /[;&|`$()]/、union/select/update 词匹配)会把正常内容
    // (如 "数字编年史(2025)"、含 & 的 URL、英文词)全部误判为攻击并 400。
    // 本项目用 Prisma 参数化查询(免疫 SQL 注入)、且不以用户输入执行 shell，
    // 该检测纯属误伤、几乎不提供保护，故移除。XSS 由上面的 HTML 净化处理。

    next();
  } catch (error) {
    console.error('输入净化错误:', error);
    next();
  }
}

/**
 * 字符串长度验证中间件
 */
export function validateStringLength(
  fields: Record<string, { min: number; max: number }>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, limits] of Object.entries(fields)) {
      const value = req.body[field];

      if (typeof value === 'string') {
        const length = value.trim().length;

        if (length < limits.min) {
          errors.push(`${field} 长度不能少于 ${limits.min} 个字符`);
        } else if (length > limits.max) {
          errors.push(`${field} 长度不能超过 ${limits.max} 个字符`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: '输入验证失败',
        details: errors,
        code: 3000,
      });
      return;
    }

    next();
  };
}

/**
 * XSS 防护响应头中间件
 */
export function addXSSProtectionHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 设置 XSS 保护响应头
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // 注:不再在此设置 CSP。原来的 "default-src 'self'" 会覆盖 helmet 的合理 CSP，
  // 导致 data: 头像、外链图片(B站/Steam 封面)、内联样式等全部被拦。CSP 交给 app.ts 的 helmet 统一管理。

  next();
}

/**
 * 内容净化（用于 Markdown 内容）
 */
export function sanitizeMarkdown(markdown: string): string {
  // 移除 HTML 标签（Markdown 不应该包含 HTML）
  let sanitized = markdown.replace(/<[^>]+>/g, '');

  // 移除 JavaScript
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized;
}

/**
 * 导出所有工具函数
 * 注意：每个函数已经在定义时单独导出，这里不再重复导出
 */
