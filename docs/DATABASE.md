# 数据库管理文档

## 快速初始化

### 自动初始化（推荐）

后端启动时会自动检查并同步数据库 schema：

```bash
cd backend
npm run dev
```

启动日志示例：
```
🚀 初始化数据库连接...
🔄 尝试连接数据库 (1/5)...
✅ 数据库连接成功
⚠️ 检测到 schema 字段缺失，需要同步
🔄 开发模式：执行 prisma db push --accept-data-loss
✅ Schema 同步成功
📊 数据库状态: 15 个技能, 8 个人脉节点
```

### 手动命令

```bash
cd backend

# 生成 Prisma Client
npm run db:generate

# 同步 schema（开发环境，接受数据丢失）
npm run db:push

# 创建迁移（生产环境）
npm run db:migrate

# 填充种子数据
npm run db:seed

# 打开 Prisma Studio
npx prisma studio
```

---

## 常见问题修复

### 字段缺失错误

**错误信息**:
```
Unknown field 'image' for select statement
```

**解决方案**:
```bash
cd backend
npm run db:fix
```

这会执行：
1. `prisma generate` - 重新生成 Client
2. `prisma db push` - 同步 schema

### 连接失败

**错误信息**:
```
Can't reach database server at localhost:5432
```

**检查清单**:
1. PostgreSQL 服务是否运行
2. DATABASE_URL 是否正确
3. 防火墙是否阻止连接
4. 数据库用户权限

### 迁移冲突

**解决方案**:
```bash
# 重置数据库（警告：数据丢失）
npx prisma migrate reset

# 或强制推送 schema
npx prisma db push --force-reset
```

---

## 数据库配置

### 环境变量

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ink_spirit_db"
INIT_DB="true"      # 启动时自动初始化
RESET_DB="false"    # 是否重置数据库
```

### Docker Compose

使用 Docker Compose 时，数据库配置在 `.env` 文件中：

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=ink_spirit_db
POSTGRES_PORT=5432
```

---

## 数据模型

### 核心模型

| 模型 | 说明 |
|------|------|
| User | 用户账户 |
| Post | 文章 |
| Project | 项目 |
| Diary | 日记 |
| Anime | 动漫记录 |
| Album | 相册 |
| Photo | 照片 |
| Skill | 技能 |
| Timeline | 时间线 |
| Connection | 人脉关系 |
| Announcement | 公告 |
| Comment | 评论 |
| SiteStats | 访问统计 |
| Setting | 系统设置 |
| MaintenanceLog | 维护日志 |

### 关系图

```
User ──┬── Post (author)
       ├── Comment (author)
       └── Anime (viewer)

Post ──┬── Comment
       └── Tag

Album ──┬── Photo
        └── Comment

Project ─── Tag
```

---

## 备份与恢复

### 备份

```bash
# 使用 pg_dump
pg_dump -U postgres ink_spirit_db > backup.sql

# 或使用 Prisma
npx prisma db pull
```

### 恢复

```bash
# 使用 psql
psql -U postgres ink_spirit_db < backup.sql

# 或重新运行迁移和种子
npx prisma migrate deploy
npx prisma db seed
```

---

## 性能优化

### 索引

Schema 中已包含以下索引：
- 外键索引
- 常用查询字段索引
- 全文搜索索引

### 查询优化建议

1. 使用 `select` 只选择需要的字段
2. 使用 `include` 预加载关联数据
3. 避免 N+1 查询
4. 大量数据使用分页

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 schema（开发） |
| `npm run db:migrate` | 创建迁移（生产） |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:fix` | 修复 schema 问题 |
| `npx prisma studio` | 打开数据库 GUI |
| `npx prisma validate` | 验证 schema |
| `npx prisma format` | 格式化 schema |
