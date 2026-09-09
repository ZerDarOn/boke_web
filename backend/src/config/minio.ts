import { Client } from 'minio';
import * as http from 'node:http';
import * as https from 'node:https';
import type { Socket } from 'node:net';
import type { TLSSocket } from 'node:tls';

export const DEFAULT_MINIO_REQUEST_TIMEOUT_MS = 15_000;
const MIN_MINIO_REQUEST_TIMEOUT_MS = 1_000;
const MAX_MINIO_REQUEST_TIMEOUT_MS = 120_000;

export const resolveMinioRequestTimeout = (value: string | undefined): number => {
  if (value === undefined || value.trim() === '') return DEFAULT_MINIO_REQUEST_TIMEOUT_MS;
  const timeoutMs = Number(value);
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < MIN_MINIO_REQUEST_TIMEOUT_MS ||
    timeoutMs > MAX_MINIO_REQUEST_TIMEOUT_MS
  ) {
    throw new Error(
      `MINIO_REQUEST_TIMEOUT_MS must be an integer between ${MIN_MINIO_REQUEST_TIMEOUT_MS} and ${MAX_MINIO_REQUEST_TIMEOUT_MS}`
    );
  }
  return timeoutMs;
};

export const resolveMinioEnabled = (
  configuredFlag: string | undefined,
  endpoint: string | undefined
): boolean => {
  if (configuredFlag !== undefined && configuredFlag.trim() !== '') {
    if (configuredFlag !== 'true' && configuredFlag !== 'false') {
      throw new Error('USE_MINIO must be either true or false');
    }
    return configuredFlag === 'true';
  }
  // Backward compatibility for installations that predate USE_MINIO: an
  // endpoint alone used to opt in. Every runtime caller uses this same rule.
  return Boolean(endpoint?.trim());
};

export const isMinioEnabled = (): boolean =>
  resolveMinioEnabled(process.env.USE_MINIO, process.env.MINIO_ENDPOINT);

export const createMinioRequestTransport = (
  baseTransport: Pick<typeof http, 'request'>,
  timeoutMs: number,
  useTLS: boolean = false
): Pick<typeof http, 'request'> => {
  const requestWithTimeout = (
    options: http.RequestOptions,
    callback?: (response: http.IncomingMessage) => void
  ): http.ClientRequest => {
    const request = callback
      ? baseTransport.request(options, callback)
      : baseTransport.request(options);

    let timedOut = false;
    let connectionDeadline: NodeJS.Timeout | undefined;
    let assignedSocket: Socket | undefined;
    let connectionEvent: 'connect' | 'secureConnect' | undefined;
    const clearConnectionDeadline = () => {
      if (!connectionDeadline) return;
      clearTimeout(connectionDeadline);
      connectionDeadline = undefined;
      if (assignedSocket && connectionEvent) {
        assignedSocket.removeListener(connectionEvent, clearConnectionDeadline);
        connectionEvent = undefined;
      }
    };
    const abortForTimeout = () => {
      if (timedOut || request.destroyed) return;
      timedOut = true;
      clearConnectionDeadline();
      request.destroy(Object.assign(new Error('MinIO request timed out'), {
        code: 'ETIMEDOUT',
      }));
    };

    // ClientRequest.setTimeout starts only after a socket connects, so it does
    // not bound stalled DNS lookups or TCP/TLS setup. This wall-clock deadline
    // covers those phases and is cleared once the connection is ready.
    connectionDeadline = setTimeout(abortForTimeout, timeoutMs);
    connectionDeadline.unref();
    request.once('socket', (socket) => {
      assignedSocket = socket;
      if (request.reusedSocket) {
        clearConnectionDeadline();
        return;
      }
      if (useTLS) {
        connectionEvent = 'secureConnect';
        (socket as TLSSocket).once(connectionEvent, clearConnectionDeadline);
        return;
      }
      if (!socket.connecting) {
        clearConnectionDeadline();
        return;
      }
      connectionEvent = 'connect';
      socket.once(connectionEvent, clearConnectionDeadline);
    });
    request.once('response', clearConnectionDeadline);
    request.once('error', clearConnectionDeadline);
    request.once('close', clearConnectionDeadline);

    // Keep an idle deadline after connection as well, including response stalls.
    request.setTimeout(timeoutMs, abortForTimeout);
    return request;
  };

  return { request: requestWithTimeout as typeof http.request };
};

// MinIO 配置 - 只有统一开关启用且 endpoint 存在时才创建客户端
const createMinioClient = (): Client | null => {
  if (!isMinioEnabled()) {
    return null;
  }
  if (!process.env.MINIO_ENDPOINT?.trim()) {
    throw new Error('USE_MINIO=true requires MINIO_ENDPOINT');
  }

  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const requestTimeoutMs = resolveMinioRequestTimeout(process.env.MINIO_REQUEST_TIMEOUT_MS);
  const baseTransport: Pick<typeof http, 'request'> = useSSL ? https : http;

  return new Client({
    endPoint: process.env.MINIO_ENDPOINT.trim(),
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    transport: createMinioRequestTransport(baseTransport, requestTimeoutMs, useSSL),
  });
};

const minioClient = createMinioClient();

// 默认 bucket 名称
const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'ink-spirit-blog';

// 初始化 bucket
export const initializeMinIO = async (): Promise<boolean> => {
  if (!minioClient) {
    return false;
  }

  try {
    // 检查 bucket 是否存在
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET);

    if (!bucketExists) {
      // 创建 bucket
      await minioClient.makeBucket(DEFAULT_BUCKET, 'us-east-1');
      console.log(`✅ MinIO bucket "${DEFAULT_BUCKET}" created successfully`);
    } else {
      console.log(`✅ MinIO bucket "${DEFAULT_BUCKET}" already exists`);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize MinIO:', error);
    return false;
  }
};

// 获取 MinIO 客户端实例
export const getMinioClient = (): Client | null => minioClient;

// 获取文件 URL
export const getFileUrl = (
  filename: string,
  type: string = 'general'
): string => {
  // Keep the shared bucket private. Public media and protected content both
  // pass through the same-origin authorization proxy.
  return `/api/minio/${encodeURIComponent(type)}/${encodeURIComponent(filename)}`;
};

// 获取文件的完整对象名
export const getObjectKey = (filename: string, type: string): string => {
  return `${type}/${filename}`;
};

export default minioClient;
