# 数据库初始化指南

## 快速修复

如果遇到 `Unknown field 'image' for select statement` 错误，运行：

```bash
cd ink-spirit-blog/backend
npm run db:fix
```

## 自动初始化（推荐）

后端启动时会**自动**检查并同步数据库 schema：

```bash
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
✅ 数据库 schema 已同步

📊 数据库状态: 15 个技能, 8 个人脉节点

🚀 INK.SPIRIT Backend Server
═════════════════════════════════════
📡 Server running on port: 3001
```

## 手动命令

### 开发环境

```bash
# 快速同步 schema（自动处理字段变更）
npm run db:fix

# 或分步执行
npm run db:generate    # 生成 Prisma Client
npm run db:push        # 同步 schema（接受数据丢失）
```

### 生产环境

```bash
# 创建迁移文件
npx prisma migrate dev --name add_image_field

# 部署迁移
npx prisma migrate deploy
```

## 常见问题

### 1. 连接失败

```
❌ 无法连接到数据库，请检查:
   1. PostgreSQL 服务是否运行
   2. DATABASE_URL 环境变量是否正确
   3. 数据库是否存在且有权限访问
```

**解决：**
```bash
# 检查 PostgreSQL 服务
pg_isready -h localhost -p 5432

# Windows 启动服务
net start postgresql
```

### 2. Schema 不同步

```
Unknown field 'image' for select statement on model 'Skill'
```

**解决：**
```bash
npm run db:fix
# 然后重启后端
npm run dev
```

### 3. 权限错误

确保 PostgreSQL 用户有创建表的权限：

```sql
GRANT ALL PRIVILEGES ON DATABASE ink_spirit TO your_user;
```

## 环境变量

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/ink_spirit?schema=public"
JWT_SECRET="your-secret-key"
PORT=3001
```

## Schema 变更流程

1. 修改 `prisma/schema.prisma`
2. 重启后端（自动同步）或运行 `npm run db:fix`
3. 无需其他操作

## 支持的字段类型

当前 Schema 包含：

**Skill 模型：**
- `id`, `name`, `category`, `level`, `rank`
- `nodeX`, `nodeY`, `nodeType`, `connections`
- `image` ⭐ 新增
- `buttonEnabled`, `buttonLabel`, `buttonLink` ⭐ 新增

**NetworkNode 模型：**
- `id`, `name`, `role`, `description`, `avatar`
- `x`, `y`, `type`, `connections`
- `buttonEnabled`, `buttonLabel`, `buttonLink` ⭐ 新增
