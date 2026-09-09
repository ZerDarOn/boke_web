export const CLIENT_ERROR_REPORT_MAX_BYTES = 12 * 1024;

const CLIENT_ERROR_FIELD_MAX_BYTES = {
  name: 128,
  message: 1024,
  stack: 4096,
  componentStack: 4096,
  timestamp: 64,
  url: 1024,
  userAgent: 512,
} as const;

const CLIENT_ERROR_INPUT_FIELDS = new Set(Object.keys(CLIENT_ERROR_FIELD_MAX_BYTES));

const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]'],
  [/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]'],
  [
    /\b(password|passwd|token|api[_-]?key|secret|authorization|cookie)(["']?\s*[:=]\s*["']?)([^"',;\s}\]]+)/gi,
    '$1$2[REDACTED]',
  ],
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED]'],
  [/\b[A-Fa-f0-9]{32,}\b/g, '[REDACTED]'],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED]'],
];

export interface ClientErrorReport {
  errorName?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  clientTimestamp?: string;
  path?: string;
}

export type ClientErrorReportResult =
  | { valid: true; report: ClientErrorReport }
  | {
      valid: false;
      reason:
        | 'invalid_payload'
        | 'payload_too_large'
        | 'unexpected_field'
        | 'invalid_field'
        | 'message_required';
    };

function utf8Size(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}

function redactSensitiveText(value: string): string {
  return REDACTION_PATTERNS.reduce(
    (redacted, [pattern, replacement]) => redacted.replace(pattern, replacement),
    value
  );
}

function extractSafePath(value: string): string | undefined {
  try {
    const parsed = new URL(value, 'https://client.invalid');
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.pathname ? redactSensitiveText(parsed.pathname) : '/';
  } catch {
    return undefined;
  }
}

export function sanitizeClientErrorReport(input: unknown): ClientErrorReportResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, reason: 'invalid_payload' };
  }

  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(input);
  } catch {
    return { valid: false, reason: 'invalid_payload' };
  }

  if (typeof serialized !== 'string') {
    return { valid: false, reason: 'invalid_payload' };
  }
  if (utf8Size(serialized) > CLIENT_ERROR_REPORT_MAX_BYTES) {
    return { valid: false, reason: 'payload_too_large' };
  }

  const payload = input as Record<string, unknown>;
  if (Object.keys(payload).some((field) => !CLIENT_ERROR_INPUT_FIELDS.has(field))) {
    return { valid: false, reason: 'unexpected_field' };
  }

  for (const [field, value] of Object.entries(payload)) {
    if (typeof value !== 'string') {
      return { valid: false, reason: 'invalid_field' };
    }
    const limit = CLIENT_ERROR_FIELD_MAX_BYTES[field as keyof typeof CLIENT_ERROR_FIELD_MAX_BYTES];
    if (utf8Size(value) > limit) {
      return { valid: false, reason: 'invalid_field' };
    }
  }

  if (typeof payload.message !== 'string' || !payload.message.trim()) {
    return { valid: false, reason: 'message_required' };
  }

  const report: ClientErrorReport = {
    message: redactSensitiveText(payload.message.trim()),
  };

  if (typeof payload.name === 'string' && payload.name.trim()) {
    report.errorName = redactSensitiveText(payload.name.trim());
  }
  if (typeof payload.stack === 'string' && payload.stack.trim()) {
    report.stack = redactSensitiveText(payload.stack.trim());
  }
  if (typeof payload.componentStack === 'string' && payload.componentStack.trim()) {
    report.componentStack = redactSensitiveText(payload.componentStack.trim());
  }
  if (typeof payload.timestamp === 'string' && payload.timestamp.trim()) {
    const clientTimestamp = new Date(payload.timestamp);
    if (Number.isNaN(clientTimestamp.getTime())) {
      return { valid: false, reason: 'invalid_field' };
    }
    report.clientTimestamp = clientTimestamp.toISOString();
  }
  if (typeof payload.url === 'string' && payload.url.trim()) {
    report.path = extractSafePath(payload.url.trim());
  }

  return { valid: true, report };
}
