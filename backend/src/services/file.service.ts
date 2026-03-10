import { Client } from 'minio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getMinioClient, getObjectKey } from '../config/minio';

// 文件元数据接口
interface FileMetadata {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt: string;
  protected?: boolean;
  passwordHash?: string;
  fileType?: string;
  children?: FileMetadata[];
}

// 本地文件存储目录
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'content-files');

// 元数据存储路径
const METADATA_PATH = path.join(process.cwd(), 'file-metadata.json');

// 确保本地存储目录存在
const ensureLocalDir = () => {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
};

// 加载元数据
const loadMetadata = (): Map<string, FileMetadata> => {
  try {
    if (fs.existsSync(METADATA_PATH)) {
      const data = fs.readFileSync(METADATA_PATH, 'utf-8');
      const json = JSON.parse(data);
      return new Map(Object.entries(json));
    }
  } catch (error) {
    console.error('Failed to load metadata:', error);
  }
  return new Map();
};

// 保存元数据
const saveMetadata = (metadata: Map<string, FileMetadata>) => {
  try {
    const json = Object.fromEntries(metadata);
    fs.writeFileSync(METADATA_PATH, JSON.stringify(json, null, 2));
  } catch (error) {
    console.error('Failed to save metadata:', error);
  }
};

// 哈希密码
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 验证密码
const verifyPassword = (password: string, hash: string): boolean => {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
};

class FileService {
  private minioClient: Client | null;
  private bucket: string;
  private metadata: Map<string, FileMetadata>;
  private useMinIO: boolean;

  constructor() {
    this.minioClient = getMinioClient();
    this.bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';
    this.metadata = loadMetadata();
    this.useMinIO = !!process.env.MINIO_ENDPOINT;

    if (!this.useMinIO) {
      console.log('⚠️  MinIO not configured, using local file system');
      ensureLocalDir();
    }
  }

  // 初始化
  async initialize(): Promise<void> {
    if (!this.useMinIO) {
      console.log('✅ File service initialized (local file system)');
      return;
    }

    try {
      const bucketExists = await this.minioClient!.bucketExists(this.bucket);
      if (!bucketExists) {
        await this.minioClient!.makeBucket(this.bucket, 'us-east-1');
        console.log(`✅ Created MinIO bucket: ${this.bucket}`);
      }
      console.log(`✅ MinIO bucket "${this.bucket}" is ready`);
    } catch (error) {
      console.error('❌ Failed to initialize MinIO bucket:', error);
      throw error;
    }
  }

  // 获取本地文件路径
  private getLocalPath(key: string): string {
    return path.join(LOCAL_STORAGE_DIR, key);
  }

  // 获取文件列表
  async listFiles(prefix: string = ''): Promise<FileMetadata[]> {
    try {
      const files: FileMetadata[] = [];
      let metadataChanged = false;

      if (this.useMinIO) {
        // 使用 MinIO
        const objects = await this.minioClient!.listObjects(this.bucket, prefix, false);
        const seenPaths = new Set<string>();

        for (const obj of objects) {
          if (!obj.name) continue;

          const key = obj.name;
          const name = key.split('/').pop() || '';
          const meta = this.metadata.get(key);
          const isPrefix = key.endsWith('/');

          if (isPrefix && !seenPaths.has(key)) {
            seenPaths.add(key);
            files.push({
              name: name || key.replace(/\/$/, ''),
              type: 'directory',
              path: key,
              modifiedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
              protected: false,
              children: [],
            });
          } else if (!isPrefix) {
            seenPaths.add(key);
            files.push({
              name,
              type: 'file',
              path: key,
              size: obj.size,
              modifiedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
              protected: meta?.protected || false,
              passwordHash: meta?.passwordHash,
              fileType: meta?.fileType,
              children: [],
            });
          }
        }
      } else {
        // 使用本地文件系统
        const localPath = this.getLocalPath(prefix);
        
        // 清理不存在的元数据项
        for (const [key, meta] of this.metadata) {
          const metaPath = this.getLocalPath(key);
          if (!fs.existsSync(metaPath)) {
            this.metadata.delete(key);
            metadataChanged = true;
          }
        }
        
        if (!fs.existsSync(localPath)) {
          if (metadataChanged) saveMetadata(this.metadata);
          return [];
        }

        const items = fs.readdirSync(localPath);
        
        for (const name of items) {
          const fullPath = path.join(localPath, name);
          const stats = fs.statSync(fullPath);
          const key = prefix ? `${prefix}/${name}` : name;
          const meta = this.metadata.get(key);

          files.push({
            name,
            type: stats.isDirectory() ? 'directory' : 'file',
            path: key,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            protected: meta?.protected || false,
            passwordHash: meta?.passwordHash,
            fileType: meta?.fileType,
            children: [],
          });
        }

        // 排序：目录在前，文件在后
        files.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }

      // 如果有元数据变更，保存
      if (metadataChanged) {
        saveMetadata(this.metadata);
      }

      return files.filter(f => f.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  // 获取文件内容
  async getFileContent(key: string): Promise<string> {
    if (this.useMinIO) {
      const stream = await this.minioClient!.getObject(this.bucket, key);
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        stream.on('error', reject);
      });
    } else {
      const localPath = this.getLocalPath(key);
      return fs.readFileSync(localPath, 'utf-8');
    }
  }

  // 上传文件
  async uploadFile(key: string, content: string, metadata?: Partial<FileMetadata>): Promise<void> {
    if (this.useMinIO) {
      await this.minioClient!.putObject(this.bucket, key, content);
    } else {
      const localPath = this.getLocalPath(key);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, content, 'utf-8');
    }

    if (metadata) {
      const meta: FileMetadata = {
        name: metadata.name || key.split('/').pop() || '',
        type: 'file',
        path: key,
        size: Buffer.byteLength(content),
        modifiedAt: new Date().toISOString(),
        ...metadata,
      };
      this.metadata.set(key, meta);
      saveMetadata(this.metadata);
    }
  }

  // 创建目录（元数据）
  async createDirectory(key: string, metadata?: Partial<FileMetadata>): Promise<void> {
    if (!this.useMinIO) {
      const localPath = this.getLocalPath(key);
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }
    }

    const meta: FileMetadata = {
      name: metadata?.name || key.split('/').pop() || '',
      type: 'directory',
      path: key,
      modifiedAt: new Date().toISOString(),
      ...metadata,
    };
    this.metadata.set(key, meta);
    saveMetadata(this.metadata);
  }

  // 删除文件
  async deleteFile(key: string): Promise<void> {
    if (this.useMinIO) {
      await this.minioClient!.removeObject(this.bucket, key);
    } else {
      const localPath = this.getLocalPath(key);
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        if (stats.isDirectory()) {
          fs.rmSync(localPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(localPath);
        }
      }
    }
    this.metadata.delete(key);
    saveMetadata(this.metadata);
  }

  // 设置文件密码
  async setPassword(key: string, password: string): Promise<void> {
    const meta = this.metadata.get(key);
    if (meta) {
      meta.protected = true;
      meta.passwordHash = hashPassword(password);
      this.metadata.set(key, meta);
      saveMetadata(this.metadata);
    }
  }

  // 移除文件密码保护
  async removePassword(key: string): Promise<void> {
    const meta = this.metadata.get(key);
    if (meta) {
      meta.protected = false;
      meta.passwordHash = undefined;
      this.metadata.set(key, meta);
      saveMetadata(this.metadata);
    }
  }

  // 验证文件密码
  async verifyPassword(key: string, password: string): Promise<boolean> {
    const meta = this.metadata.get(key);
    if (!meta?.protected || !meta?.passwordHash) {
      return true; // 未受保护的文件
    }
    return verifyPassword(password, meta.passwordHash);
  }

  // 获取文件下载URL
  async getPresignedUrl(key: string, expiry: number = 3600): Promise<string> {
    if (this.useMinIO) {
      return await this.minioClient!.presignedGetObject(this.bucket, key, expiry);
    } else {
      // 本地文件系统不支持预签名URL
      const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
      return `${API_BASE_URL}/api/files/download?path=${encodeURIComponent(key)}`;
    }
  }
}

export default new FileService();
