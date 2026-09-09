# MinIO 对象存储集成文档

> **更新时间**: 2026年9月4日
> **版本**: v1.1

---

## 📋 概述

本项目已集成 **MinIO** 对象存储服务，用于替代传统的本地文件存储。MinIO 是一个高性能的分布式对象存储服务，兼容 Amazon S3 API。

### 主要优势

- ✅ **可扩展性**：支持分布式存储，易于扩展
- ✅ **性能优秀**：高性能的对象存储，适合大量小文件
- ✅ **兼容 S3 API**：可以使用任何 S3 兼容的客户端
- ✅ **可靠性**：支持数据冗余和故障恢复
- ✅ **成本低**：自建存储，无额外费用
- ✅ **Web 界面**：提供直观的 Web 控制台

---

## 🚀 快速开始

### 方式一：使用 Docker Compose（推荐）

1. **启动所有服务**
   ```bash
   cd ink-spirit-blog
   docker-compose up -d
   ```

2. **访问 MinIO 控制台**
   - URL: http://localhost:9001
   - 用户名: `minioadmin`
   - 密码: `minioadmin123`

3. **验证服务**
   - 登录后，您应该能看到名为 `ink-spirit-blog` 的 bucket
   - 后端会自动创建该 bucket

### 方式二：本地安装 MinIO

1. **下载 MinIO**
   ```bash
   # Linux
   wget https://dl.min.io/server/minio/release/linux-amd64/minio
   chmod +x minio
   ./minio server /data --console-address ":9001"

   # macOS
   brew install minio/stable/minio
   minio server /data --console-address ":9001"

   # Windows
   # 下载 https://dl.min.io/server/minio/release/windows-amd64/minio.exe
   minio.exe server C:\minio-data --console-address ":9001"
   ```

2. **配置环境变量**
   编辑 `.env` 文件：
   ```env
   USE_MINIO=true
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin123
   MINIO_BUCKET=ink-spirit-blog
   ```

3. **启动后端**
   ```bash
   cd backend
   npm run dev
   ```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `USE_MINIO` | 是否启用 MinIO，只接受 `true` / `false` | `false` | 否 |
| `MINIO_ENDPOINT` | MinIO 服务器地址 | `localhost` | 是（如果启用） |
| `MINIO_PORT` | MinIO 服务器端口 | `9000` | 是（如果启用） |
| `MINIO_USE_SSL` | 是否使用 SSL | `false` | 否 |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `minioadmin` | 是（如果启用） |
| `MINIO_SECRET_KEY` | MinIO 秘密密钥 | `minioadmin123` | 是（如果启用） |
| `MINIO_BUCKET` | Bucket 名称 | `ink-spirit-blog` | 否 |
| `MINIO_REQUEST_TIMEOUT_MS` | DNS/TCP/TLS 建连及已连接 socket 空闲超时（1000–120000 ms） | `15000` | 否 |
| `FILE_STORAGE_DIR` | 文件浏览器的本地存储目录 | `content-files` | 否 |
| `FILE_METADATA_PATH` | 密码保护索引；必须位于公开存储目录外 | `storage-metadata/file-metadata.json` | 否 |
| `FILE_METADATA_ALLOW_EMPTY_INITIALIZATION` | 一次性灾难恢复开关，详见下文 | `false` | 否 |
| `FILE_METADATA_ALLOW_UNBOUND_MIGRATION` | 非空旧索引的一次性存储绑定开关，详见下文 | `false` | 否 |

### 存储类型说明

系统支持两种存储方式：

`USE_MINIO` 是上传、文件浏览、代理和状态页共用的总开关；设为 `true` 时必须同时配置 `MINIO_ENDPOINT`。为兼容旧部署，仅当 `USE_MINIO` 完全未设置时，已有的 `MINIO_ENDPOINT` 仍会隐式启用 MinIO。

1. **MinIO 存储**（USE_MINIO=true）
   - 文件存储在 MinIO 对象存储中
   - MinIO 本身可扩展，但本项目的文件权限索引只支持一个后端进程/副本
   - 适合生产环境

2. **本地存储**（USE_MINIO=false）
   - 文件存储在 `uploads/` 目录
   - 简单直接，无需额外配置
   - 适合开发和测试环境

---

## 🔧 使用指南

### 上传文件

文件上传接口保持不变，后端会自动根据 `USE_MINIO` 配置选择存储方式。

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/upload/image/anime \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@example.jpg"
```

**响应示例**：
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "originalUrl": "/api/minio/anime/xxx.jpg",
    "filename": "xxx.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "dimensions": {
      "width": 800,
      "height": 600
    }
  }
}
```

### 访问文件

所有文件都通过应用的同源代理访问：
```
/api/minio/anime/xxx.jpg
```

共享 bucket 必须保持私有，不能配置匿名读取或向公网暴露对象直链。公开媒体和密码保护文件共用这条代理链路；受保护文件通过 `X-File-Password` 请求头或管理员身份完成后端鉴权。

### 删除文件

```bash
curl -X DELETE http://localhost:3001/api/upload/anime/xxx.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 文件组织结构

### MinIO 中的目录结构

```
ink-spirit-blog/
├── posts/          # 文章图片
├── anime/          # 动漫封面
├── gallery/        # 相册图片
├── projects/       # 项目图片
├── skills/         # 技能图标
├── network/        # 关系网络图片
├── avatars/        # 用户头像
└── general/        # 其他文件
```

### 本地存储目录结构

```
uploads/
├── posts/
├── anime/
├── gallery/
├── projects/
├── skills/
├── network/
├── avatars/
└── general/
```

---

## 🔒 安全建议

### 生产环境配置

1. **更改默认凭据**
   ```env
   MINIO_ACCESS_KEY=your-strong-access-key
   MINIO_SECRET_KEY=your-strong-secret-key-change-me
   ```

2. **启用 SSL/TLS**
   ```env
   MINIO_USE_SSL=true
   ```

3. **设置访问策略**
   - 保持 bucket 私有，不配置 anonymous/public read policy
   - 只授予后端服务账号所需的对象读写权限，以及读取 bucket policy 的权限
   - 公开媒体与受保护文件都由后端代理鉴权

4. **配置防火墙**
   - 生产环境仅允许后端访问 MinIO API 端口（9000）
   - 控制台端口（9001）只允许运维网络访问

### 文件浏览器的权限索引

文件浏览器不会把“没有索引记录”直接等同于公开。首次可信初始化时，后端会在实际存储中创建随机身份标记 `.ink-spirit-storage-identity`，并把同一 UUID 写入 `FILE_METADATA_PATH`。后续启动必须同时验证存储类型和 UUID；切换目录、bucket、挂载卷，或索引/标记丢失时会拒绝启动文件服务，避免把原本受密码保护的对象误当成公开文件。

- `FILE_STORAGE_DIR` 与 `FILE_METADATA_PATH` 不能相同，索引也不能放在公开存储目录内。
- 本地存储目录（或整个 MinIO bucket）、身份标记和权限索引必须成组备份、恢复、复制。
- 不要删除或手工编辑身份标记；它不会出现在公开列表，也不能通过文件接口读取。
- 权限索引和归档的旧索引包含密码哈希，仍属于敏感数据，必须放在非公开持久卷并限制文件权限。
- 当前权限索引是本地 JSON，并发控制只覆盖单个 Node.js 进程。生产环境必须保持一个后端进程/副本；不要使用 PM2 cluster、Node cluster 或多个容器共同写入这份索引。
- bucket 必须保持私有。后端启动时会读取 bucket policy 并拒绝匿名 `GetObject`；服务账号缺少读取 policy 的权限也会安全失败。

#### 从旧版索引升级

升级前先停止后端并备份现有存储和 `backend/file-metadata.json`。在新 `FILE_METADATA_PATH` 尚不存在、旧文件仍存在时启动一个后端实例：后端会先核对实际存储，写入绑定后的 v2 索引，再把旧文件原子归档为 `file-metadata.legacy-migrated*.json`。只有新索引成功持久化后才会归档旧文件。

非空旧索引没有物理存储 UUID，因此只要当前存储也非空，默认就会拒绝静默绑定。先离线核对旧索引确实来自该目录/bucket，并确认所有应受保护对象都有对应保护记录；然后临时设置 `FILE_METADATA_ALLOW_UNBOUND_MIGRATION=true` 启动一次。看到 v2 索引和归档文件后立即恢复为 `false`。旧索引或目标存储为空时不需要这个开关。

若旧索引为空/缺失而实际存储非空，或索引绑定到另一份存储，启动会故意失败。只有在人工逐项确认所有现有对象本来就应公开时，才可临时设置 `FILE_METADATA_ALLOW_EMPTY_INITIALIZATION=true` 启动一次；确认 v2 索引已生成后立即删除该变量或恢复为 `false`。不要用该开关处理未知来源或曾包含受保护文件的存储，也不要把两个一次性开关长期留在环境中。

从本地目录切换到 MinIO（或更换 bucket/卷）不能只修改环境变量。应停机后成组迁移对象、身份标记和权限索引，再启动单个后端实例验证；不确定时保留旧存储并让启动失败，不要重建空索引。

### 备份策略

```bash
# 使用 MinIO Client (mc) 工具备份
# 安装: https://min.io/docs/minio/linux/reference/minio-mc.html

# 配置 MinIO 服务器
mc alias set myminio http://localhost:9000 minioadmin minioadmin123

# 备份 bucket
mc cp --recursive myminio/ink-spirit-blog/ /backup/ink-spirit-blog/

# 恢复 bucket
mc cp --recursive /backup/ink-spirit-blog/ myminio/ink-spirit-blog/
```

---

## 🐛 故障排查

### 问题 1：无法连接到 MinIO

**症状**：后端启动时提示 "Failed to initialize MinIO"

**解决方案**：
1. 检查 MinIO 是否正在运行
   ```bash
   docker ps | grep minio
   # 或
   curl http://localhost:9000/minio/health/live
   ```

2. 检查网络连接
   ```bash
   telnet localhost 9000
   ```

3. 检查环境变量配置
   ```bash
   docker-compose logs backend | grep MINIO
   ```

### 问题 2：上传失败

**症状**：上传接口返回错误

**解决方案**：
1. 检查 bucket 是否存在
   - 登录 MinIO 控制台
   - 确认 `ink-spirit-blog` bucket 存在

2. 检查存储空间
   ```bash
   mc admin info myminio
   ```

3. 查看后端日志
   ```bash
   docker-compose logs backend -f
   ```

### 问题 3：文件无法访问

**症状**：图片显示 404

**解决方案**：
1. 检查文件是否实际存在
   ```bash
   mc ls myminio/ink-spirit-blog/anime/
   ```

2. 检查访问权限
   - 确认后端服务账号有对象读取权限
   - 确认 bucket 仍为私有，未开启匿名读取

3. 检查 URL 是否正确
   - 确认 URL 格式：`/api/minio/{type}/{filename}`

---

## 📊 性能优化

### 1. 反向代理与缓存边界

CDN 或反向代理只能转发应用的 `/api/minio/`，不得直接回源 MinIO，也不得覆盖后端返回的 `Cache-Control`。受保护响应使用 `private, no-store`；当前共享 bucket 中的公开响应必须每次重验证，不启用长期缓存。

```nginx
location /api/minio/ {
    proxy_pass http://backend:3001;
    proxy_cache off;
}
```

如果未来需要长期 CDN 缓存，先把不可变公开媒体拆到独立的 public bucket 或 namespace，不能与密码保护内容共享访问策略。

### 2. 图片压缩

后端已集成 `sharp` 进行图片压缩和缩略图生成：
- 自动生成 400px 宽度的缩略图
- 原图和缩略图都存储在 MinIO 中

---

## 🔄 迁移指南

### 从本地存储迁移到 MinIO

1. **启用 MinIO**
   ```env
   USE_MINIO=true
   ```

2. **启动 MinIO 服务**
   ```bash
   docker-compose up -d minio
   ```

3. **运行迁移脚本**
   ```bash
   # 需要创建迁移脚本（参考下文）
   node scripts/migrate-to-minio.js
   ```

### 迁移脚本示例

```javascript
// scripts/migrate-to-minio.js
const fs = require('fs');
const path = require('path');
const { Client } = require('minio');
const { v4: uuidv4 } = require('uuid');

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucket = 'ink-spirit-blog';
const uploadDir = path.join(__dirname, '../uploads');

async function migrateFolder(folderPath, type) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && !file.startsWith('thumb_')) {
      const fileContent = fs.readFileSync(filePath);
      const objectKey = `${type}/${file}`;

      await minioClient.putObject(
        bucket,
        objectKey,
        fileContent,
        stats.size,
        { 'Content-Type': 'image/jpeg' }
      );

      console.log(`✅ Uploaded: ${objectKey}`);

      // 上传缩略图
      const thumbPath = path.join(folderPath, `thumb_${file}`);
      if (fs.existsSync(thumbPath)) {
        const thumbContent = fs.readFileSync(thumbPath);
        const thumbStats = fs.statSync(thumbPath);

        await minioClient.putObject(
          bucket,
          `${type}/thumb_${file}`,
          thumbContent,
          thumbStats.size,
          { 'Content-Type': 'image/jpeg' }
        );

        console.log(`✅ Uploaded thumbnail: ${type}/thumb_${file}`);
      }
    }
  }
}

async function main() {
  const folders = fs.readdirSync(uploadDir);

  for (const folder of folders) {
    const folderPath = path.join(uploadDir, folder);

    if (fs.statSync(folderPath).isDirectory()) {
      console.log(`📁 Migrating folder: ${folder}`);
      await migrateFolder(folderPath, folder);
    }
  }

  console.log('✅ Migration completed!');
}

main().catch(console.error);
```

---

## 📚 参考资料

- [MinIO 官方文档](https://min.io/docs/)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [S3 API 规范](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)

---

## 📞 支持

如有问题，请联系：
- GitHub Issues: https://github.com/your-repo/ink-spirit-blog/issues
- Email: your-email@example.com

---

**最后更新**: 2026年9月4日
**文档版本**: v1.1
