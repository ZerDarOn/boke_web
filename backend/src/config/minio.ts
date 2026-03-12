import { Client } from 'minio';

// MinIO 配置 - 仅在配置了 MINIO_ENDPOINT 时创建客户端
const createMinioClient = (): Client | null => {
  if (!process.env.MINIO_ENDPOINT) {
    return null;
  }

  return new Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
};

const minioClient = createMinioClient();

// 默认 bucket 名称
const DEFAULT_BUCKET = 'ink-spirit-blog';

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
  const baseUrl = process.env.MINIO_PUBLIC_URL || process.env.API_URL || 'http://localhost:3001';

  // 如果 MinIO 有公网 URL，直接使用
  if (process.env.MINIO_PUBLIC_URL) {
    return `${baseUrl}/${DEFAULT_BUCKET}/${type}/${filename}`;
  }

  // 否则通过后端代理访问
  return `${baseUrl}/api/minio/${type}/${filename}`;
};

// 获取文件的完整对象名
export const getObjectKey = (filename: string, type: string): string => {
  return `${type}/${filename}`;
};

export default minioClient;
