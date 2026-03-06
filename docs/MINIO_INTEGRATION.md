# MinIO 对象存储集成文档

> **更新时间**: 2026年3月5日
> **版本**: v1.0

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
| `USE_MINIO` | 是否启用 MinIO | `false` | 否 |
| `MINIO_ENDPOINT` | MinIO 服务器地址 | `localhost` | 是（如果启用） |
| `MINIO_PORT` | MinIO 服务器端口 | `9000` | 是（如果启用） |
| `MINIO_USE_SSL` | 是否使用 SSL | `false` | 否 |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `minioadmin` | 是（如果启用） |
| `MINIO_SECRET_KEY` | MinIO 秘密密钥 | `minioadmin123` | 是（如果启用） |
| `MINIO_BUCKET` | Bucket 名称 | `ink-spirit-blog` | 否 |
| `MINIO_PUBLIC_URL` | MinIO 公网 URL | 空 | 否 |

### 存储类型说明

系统支持两种存储方式：

1. **MinIO 存储**（USE_MINIO=true）
   - 文件存储在 MinIO 对象存储中
   - 支持大规模存储和分布式部署
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
    "originalUrl": "http://localhost:3001/api/minio/anime/xxx.jpg",
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

**方式一：通过后端代理**（默认）
```
http://localhost:3001/api/minio/anime/xxx.jpg
```

**方式二：直接访问 MinIO**（如果设置了 MINIO_PUBLIC_URL）
```
http://localhost:9000/ink-spirit-blog/anime/xxx.jpg
```

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
   - 登录 MinIO 控制台
   - 进入 Bucket Policy
   - 设置适当的访问权限（如只读公共访问）

4. **配置防火墙**
   - 限制 MinIO 端口的访问（9000 和 9001）
   - 只允许受信任的 IP 访问

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
   - 确保 bucket 策略允许读取

3. 检查 URL 是否正确
   - 确认 URL 格式：`/api/minio/{type}/{filename}` 或 `{MINIO_PUBLIC_URL}/{bucket}/{type}/{filename}`

---

## 📊 性能优化

### 1. 使用 CDN

如果 MinIO 有公网访问地址，建议使用 CDN 加速：

```env
MINIO_PUBLIC_URL=https://cdn.yourdomain.com
```

### 2. 启用缓存

配置 CDN 或反向代理缓存：

```nginx
location /api/minio/ {
    proxy_cache minio_cache;
    proxy_pass http://backend:3001;
    proxy_cache_valid 200 30d;
}
```

### 3. 图片压缩

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

**最后更新**: 2026年3月5日
**文档版本**: v1.0
