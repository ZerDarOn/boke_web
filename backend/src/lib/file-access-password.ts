export const FILE_ACCESS_PASSWORD_HEADER = 'x-file-password';

const REDACTED_PASSWORD_VALUE = '[REDACTED]';
const SENSITIVE_REQUEST_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'authorizationcode',
]);
const SENSITIVE_REQUEST_KEY_SUFFIXES = [
  'password',
  'token',
  'secret',
  'apikey',
  'authorization',
] as const;

function decodeQueryKey(rawKey: string): string {
  let decodedKey = rawKey.replace(/\+/g, ' ');
  for (let pass = 0; pass < 3; pass += 1) {
    try {
      const decoded = decodeURIComponent(decodedKey);
      if (decoded === decodedKey) break;
      decodedKey = decoded;
    } catch {
      break;
    }
  }
  return decodedKey;
}

function isSensitiveRequestKey(rawKey: string): boolean {
  const decodedKey = decodeQueryKey(rawKey).toLowerCase();
  const keySegments = decodedKey
    .split(/[.[\]]+/)
    .map((segment) => segment.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  return keySegments.some((segment) =>
    SENSITIVE_REQUEST_KEYS.has(segment) ||
    SENSITIVE_REQUEST_KEY_SUFFIXES.some((suffix) => segment.endsWith(suffix))
  );
}

/**
 * File credentials are accepted only through a request header so reverse
 * proxies, browser history, and CDN access logs never receive them in a URL.
 * Password values are intentionally not trimmed because whitespace may be valid.
 */
export function resolveFileAccessPassword(headerValue: unknown): string | undefined {
  if (typeof headerValue === 'string' && headerValue.length > 0) {
    return headerValue;
  }

  return undefined;
}

/** Redact accidental legacy query credentials before local request logging. */
export function redactFileAccessPasswordFromUrl(requestUrl: string): string {
  return requestUrl.replace(/([?&])([^=&#]*)(?:=([^&#]*))?/g, (part, separator, rawKey) => {
    if (isSensitiveRequestKey(String(rawKey))) {
      return `${separator}${rawKey}=${REDACTED_PASSWORD_VALUE}`;
    }
    return part;
  });
}

/** Clone request data while removing nested credentials from diagnostic logs. */
export function redactSensitiveRequestData(
  value: unknown,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveRequestData(item, depth + 1, seen));
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';

  seen.add(value);
  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    sanitized[key] = isSensitiveRequestKey(key)
      ? REDACTED_PASSWORD_VALUE
      : redactSensitiveRequestData(nestedValue, depth + 1, seen);
  }
  seen.delete(value);
  return sanitized;
}
