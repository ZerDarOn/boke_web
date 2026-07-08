/**
 * 把存储的头像/图片值解析成安全可用的 <img src>。
 *
 * 兼容三种历史/导入值：
 *  1. 正常 URL 或相对路径（如 /uploads/xxx.png、https://...）—— 原样返回
 *  2. 标准 data URI（data:image/png;base64,...）—— 原样返回
 *  3. 丢了 "data:" 前缀的 base64（如 "image/png;base64,XXXX" 或纯 base64）——
 *     若不处理，会被浏览器当成相对 URL 发请求，超长 URL 触发 414/431 错误。
 *     这里补回 data: 前缀，让它能正常显示。
 */
export function resolveImageSrc(value?: string | null): string {
  if (!value) return '';
  const v = value.trim();
  if (!v) return '';

  // 已是合法的 data URI
  if (v.startsWith('data:')) return v;

  // 丢了 data: 前缀的 base64，形如 "image/png;base64,XXXX"
  if (/^image\/[\w.+-]+;base64,/i.test(v)) return `data:${v}`;

  // 纯 base64（无 mime 头）：很长且只含 base64 字符，按 png 兜底补全
  if (v.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(v)) {
    return `data:image/png;base64,${v.replace(/\s+/g, '')}`;
  }

  // 普通 URL 或相对路径
  return v;
}
