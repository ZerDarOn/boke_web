# INK.SPIRIT Backend - 常见问题解决方案

## 🚀 快速启动

### Windows 用户
```bash
# 使用启动脚本（推荐）
cd backend
start-dev.bat

# 或手动启动
cd backend
npm run dev
```

### macOS/Linux 用户
```bash
cd backend
npm run dev
```

---

## ❌ 常见错误及解决方案

### 1. 端口占用错误 (EADDRINUSE)

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**原因：** 端口 3001 已被其他进程占用

**解决方案：**

**方案 1：关闭占用端口的进程**
```bash
# Windows
netstat -ano | findstr :3001
taskkill //F //PID <进程ID>

# macOS/Linux
lsof -i :3001
kill -9 <进程ID>
```

**方案 2：更改端口号**
编辑 `backend/.env` 文件：
```env
PORT=3002
```

**方案 3：使用启动脚本自动处理**
```bash
# Windows
cd backend
start-dev.bat  # 会自动询问是否关闭占用端口的进程
```

---

### 2. 数据库密码认证失败

**错误信息：**
```
Authentication failed against database server at `localhost`,
provided database credentials for `postgres` are not valid.
```

**原因：** PostgreSQL 的 postgres 用户密码不正确

**解决方案：**

**步骤 1：查找正确的密码**
```bash
cd backend
npx tsx scripts/find-password.ts
```

这个脚本会尝试常见密码，包括：
- postgres
- 123456
- password
- admin
- 等

**步骤 2：更新 .env 文件**
找到正确密码后，编辑 `backend/.env`：
```env
DATABASE_URL=postgresql://postgres:<你的密码>@localhost:5432/ink_spirit
```

**步骤 3：如果密码仍不对**
使用 pgAdmin 工具重置密码，或直接修改 PostgreSQL 配置

---

### 3. 数据库不存在

**错误信息：**
```
database "ink_spirit" does not exist
```

**原因：** 数据库 `ink_spirit` 未创建

**解决方案：**

**使用脚本创建（推荐）：**
```bash
cd backend
npx tsx scripts/create-db-final.ts
```

**手动创建：**
```sql
-- 连接到 PostgreSQL
psql -U postgres -h localhost

-- 创建数据库
CREATE DATABASE ink_spirit;

-- 退出
\q
```

---

### 4. PostgreSQL 服务未启动

**错误信息：**
```
connect ECONNREFUSED 127.0.0.1:5432
无法连接到数据库服务器
```

**原因：** PostgreSQL 服务未运行

**解决方案：**

**Windows：**
1. 打开"服务管理器"（Win + R，输入 `services.msc`）
2. 找到 `postgresql-x64-xx` 服务
3. 右键 -> 启动

**macOS：**
```bash
brew services start postgresql
# 或
brew services start postgresql@14
```

**Linux：**
```bash
sudo systemctl start postgresql
```

**验证服务是否运行：**
```bash
# Windows
netstat -ano | findstr :5432

# macOS/Linux
lsof -i :5432
```

---

### 5. Prisma Client 未生成

**错误信息：**
```
PrismaClientInitializationError: Prisma Client could not be initialized
```

**原因：** Prisma Client 未生成或已过期

**解决方案：**
```bash
cd backend
npm run db:generate
```

---

### 6. Schema 不同步

**错误信息：**
```
Column "xxx" does not exist
Relation "xxx" does not exist
```

**原因：** 数据库 schema 与 `prisma/schema.prisma` 不同步

**解决方案：**

**开发环境：**
```bash
cd backend
npm run db:push
```

**生产环境：**
```bash
cd backend
npx prisma migrate deploy
```

---

## 🔧 辅助脚本

### 查找数据库密码
```bash
cd backend
npx tsx scripts/find-password.ts
```

### 创建数据库
```bash
cd backend
npx tsx scripts/create-db-final.ts
```

### 修复数据库
```bash
cd backend
npm run db:fix
```

---

## 📝 环境变量配置

编辑 `backend/.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://postgres:123456@localhost:5432/ink_spirit

# 服务器配置
PORT=3001
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 前端 URL
FRONTEND_URL=http://localhost:3000

# AI 服务（可选）
AI_SERVICE_URL=http://localhost:8000
```

---

## 🐛 调试技巧

### 1. 查看详细错误信息
在 `backend/src/index.ts` 中，错误信息已格式化输出，包括：
- 数据库连接错误的具体原因
- 端口占用的进程信息
- 详细的解决方案

### 2. 检查数据库连接
```bash
cd backend
node -e "require('pg').Client({host:'localhost',port:5432,user:'postgres',password:'123456',database:'ink_spirit'}).connect().then(()=>console.log('OK'),err=>console.error(err.message))"
```

### 3. 查看数据库状态
```bash
cd backend
npx prisma studio
```

### 4. 测试 API
```bash
# 测试健康检查
curl http://localhost:3001/api/health
```

---

## 💡 最佳实践

1. **使用启动脚本**：Windows 用户推荐使用 `start-dev.bat`，它会自动检查和修复常见问题
2. **定期更新 Prisma Client**：每次修改 schema 后运行 `npm run db:generate`
3. **保持数据库同步**：修改 schema 后运行 `npm run db:push`
4. **检查环境变量**：确保 `.env` 文件配置正确
5. **查看日志**：遇到问题时，仔细查看控制台输出的详细错误信息

---

## 📞 获取帮助

如果以上方案都无法解决问题：

1. 检查 PostgreSQL 日志
   - Windows: `C:\Program Files\PostgreSQL\14\data\log\`
   - macOS/Linux: `/usr/local/var/log/postgresql/`

2. 查看项目文档
   - README.md
   - docs/ 目录

3. 搜索错误信息
   - Google
   - Stack Overflow
   - GitHub Issues

---

**最后更新：** 2026年3月9日
**维护者：** INK.SPIRIT Team
