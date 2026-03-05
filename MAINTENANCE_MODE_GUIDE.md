# 维护模式日志系统 - 完整实现

## 📋 功能概述

这是一个完整的维护模式日志系统，包含：
- ✅ 密码保护的访问控制
- ✅ 失败尝试限制（5次后锁定15分钟）
- ✅ 多类别日志查看（Maintenance, System, API, Database）
- ✅ 日志过滤（按级别）
- ✅ 日志搜索
- ✅ 日志导出（JSON格式）
- ✅ 自动日志清理（7天保留期）
- ✅ Token 认证机制（30分钟过期）
- ✅ 实时日志刷新

---

## 🛠️ 后端实现

### 1. 文件结构

```
backend/
├── src/
│   ├── middleware/
│   │   └── maintenance.middleware.ts  # 认证中间件
│   ├── controllers/
│   │   └── maintenance.controller.ts  # 日志控制器
│   ├── routes/
│   │   └── maintenance.ts            # 路由定义
│   ├── lib/
│   │   └── logger.ts                # 日志记录工具
│   └── app.ts                       # 应用入口
├── logs/                            # 日志文件存储目录
│   ├── maintenance.log
│   ├── system.log
│   ├── api.log
│   └── database.log
└── .env                             # 环境变量配置
```

### 2. 环境变量配置

在 `backend/.env` 中添加：

```env
# Maintenance Mode
MAINTENANCE_MODE="false"
MAINTENANCE_PASSWORD="admin123"

# Log Configuration
LOG_RETENTION_DAYS="7"
```

**说明：**
- `MAINTENANCE_MODE`: 是否启用维护模式（true/false）
- `MAINTENANCE_PASSWORD`: 维护模式访问密码
- `LOG_RETENTION_DAYS`: 日志保留天数

### 3. API 端点

#### 公开端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/maintenance/status` | 获取维护模式状态 |
| POST | `/api/maintenance/login` | 登录维护模式 |
| GET | `/api/maintenance/verify` | 验证 Token |

#### 保护端点（需要认证）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/maintenance/logs/maintenance` | 获取维护日志 |
| GET | `/api/maintenance/logs/system` | 获取系统日志 |
| GET | `/api/maintenance/logs/api` | 获取 API 日志 |
| GET | `/api/maintenance/logs/database` | 获取数据库日志 |
| GET | `/api/maintenance/logs/categories` | 获取所有日志类别 |
| GET | `/api/maintenance/logs/filter` | 按级别过滤日志 |
| GET | `/api/maintenance/logs/search` | 搜索日志 |
| POST | `/api/maintenance/logs/clear` | 清空日志 |

### 4. 认证流程

#### 登录流程

```typescript
POST /api/maintenance/login
{
  "password": "admin123"
}

// 成功响应
{
  "success": true,
  "data": {
    "token": "maint_1234567890_abc123def",
    "expiry": 1800000, // 30分钟
    "maintenanceMode": false
  }
}

// 失败响应
{
  "success": false,
  "error": "Invalid password",
  "remainingAttempts": 4,
  "maxAttempts": 5
}

// 锁定响应
{
  "success": false,
  "error": "Too many failed attempts. Please try again later.",
  "lockoutRemaining": 15 // 分钟
}
```

#### 使用 Token 访问保护端点

```typescript
GET /api/maintenance/logs/maintenance
Headers: {
  "x-maintenance-token": "maint_1234567890_abc123def"
}
```

### 5. 安全特性

#### 失败尝试限制
- 最多 5 次失败尝试
- 超过 5 次后锁定 IP 15 分钟
- 成功登录后清除失败计数

#### Token 管理
- Token 有效期：30 分钟
- Token 自动过期清理
- 内存中存储（生产环境建议使用 Redis）

#### 日志记录
- 所有登录尝试（成功/失败）都记录
- 包括 IP 地址、时间戳

---

## 🎨 前端实现

### 1. 文件结构

```
frontend/
└── src/
    ├── lib/
    │   └── maintenance.ts          # API 客户端
    └── components/
        ├── MaintenancePanel.tsx     # 维护面板组件
        └── SystemDashboard.tsx      # 仪表盘组件（已更新）
```

### 2. API 客户端

```typescript
// 检查维护模式状态
const status = await maintenanceApi.getStatus();
// { enabled: false }

// 登录
const login = await maintenanceApi.login('admin123');
// { success: true, data: { token: '...', expiry: 1800000, maintenanceMode: false } }

// 获取日志
const logs = await maintenanceApi.getLogs('Maintenance', token);
// { success: true, data: { logs: [...], total: 100 } }

// 搜索日志
const search = await maintenanceApi.searchLogs('System', 'error', token);
// { success: true, data: { logs: [...], total: 25 } }

// 清空日志
const clear = await maintenanceApi.clearLogs('Maintenance', token);
// { success: true, data: { message: '...' } }
```

### 3. 维护面板功能

#### 登录界面
- 密码输入框
- 失败提示和剩余尝试次数
- 锁定提示
- 实时验证

#### 日志查看器
- 类别选择器（Maintenance, System, API, Database）
- 级别过滤（All, Info, Warning, Error, Debug）
- 搜索功能
- 实时刷新
- 导出 JSON
- 清空日志

#### 日志显示
- 时间戳格式化
- 级别图标和颜色编码
- 堆栈跟踪展开/折叠
- 数据对象格式化显示

---

## 📊 日志系统使用

### 后端使用日志

```typescript
import { maintenanceLog, systemLog, apiLog, dbLog } from '../lib/logger';

// 记录维护日志
maintenanceLog.info('Database backup completed');
maintenanceLog.error('Backup failed', error);

// 记录系统日志
systemLog.info('Server started', { port: 3001 });
systemLog.warn('High memory usage', { usage: '95%' });

// 记录 API 日志
apiLog.info('User login', { userId: '123' });
apiLog.error('Invalid credentials', error);

// 记录数据库日志
dbLog.info('Migration completed');
dbLog.error('Connection failed', error);
```

### 日志级别

- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息
- `debug`: 调试信息

### 日志文件

日志自动保存到 `backend/logs/` 目录：

```
backend/logs/
├── maintenance.log
├── system.log
├── api.log
└── database.log
```

每条日志格式（JSON）：

```json
{
  "timestamp": "2024-03-05T10:30:00.000Z",
  "level": "info",
  "category": "Maintenance",
  "message": "Database backup completed",
  "data": {
    "duration": 5000,
    "size": "100MB"
  }
}
```

---

## 🚀 部署步骤

### 1. 后端部署

```bash
cd ink-spirit-blog/backend

# 安装依赖（如果需要）
npm install

# 添加环境变量到 .env
# MAINTENANCE_MODE="false"
# MAINTENANCE_PASSWORD="your-secure-password"

# 启动服务器
npm run dev
```

### 2. 前端部署

```bash
cd ink-spirit-blog/frontend

# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

### 3. 访问维护模式

1. 打开仪表盘：`http://localhost:3000/dashboard`
2. 找到 "MAINTENANCE MODE" 模块
3. 点击 "VIEW LOG" 按钮
4. 输入维护密码：`admin123`
5. 登录成功后进入日志查看器

---

## 🎯 使用场景

### 场景 1：日常监控

```typescript
// 在请求处理器中记录 API 日志
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    apiLog.info('Posts fetched successfully', { count: posts.length });
    res.json({ success: true, data: posts });
  } catch (error) {
    apiLog.error('Failed to fetch posts', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

### 场景 2：错误追踪

```typescript
// 在全局错误处理器中记录错误
app.use((error: Error, req, res, next) => {
  systemLog.error('Unhandled error', error, {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ success: false, error: error.message });
});
```

### 场景 3：维护操作

```typescript
// 在数据库迁移前记录
async function migrateDatabase() {
  maintenanceLog.info('Starting database migration');
  
  try {
    await runMigration();
    maintenanceLog.info('Migration completed successfully');
  } catch (error) {
    maintenanceLog.error('Migration failed', error);
    throw error;
  }
}
```

---

## 🔒 安全建议

### 生产环境

1. **强密码**
   ```env
   MAINTENANCE_PASSWORD="complex-password-with-special-chars-123!@#"
   ```

2. **环境变量保护**
   - 确保 `.env` 文件不被提交到版本控制
   - 使用 `.env.example` 作为模板

3. **Token 存储**
   - 生产环境使用 Redis 存储 Token
   - 添加 Token 撤销机制

4. **HTTPS**
   - 确保生产环境使用 HTTPS
   - 设置 CSP 头

### 日志安全

1. **敏感信息过滤**
   - 不要记录密码、令牌等敏感信息
   - 使用日志脱敏技术

2. **访问控制**
   - 限制日志文件访问权限
   - 定期清理旧日志

---

## 📈 性能优化

### 日志轮转

系统自动清理 7 天前的日志。可配置：

```env
LOG_RETENTION_DAYS="30"  # 保留30天
```

### 异步日志写入

日志写入是异步的，不会阻塞主线程。

---

## 🐛 故障排查

### 问题 1：登录失败

**症状**：输入正确密码但无法登录

**解决方案**：
1. 检查 `.env` 中的 `MAINTENANCE_PASSWORD`
2. 确认没有空格或特殊字符
3. 检查是否被锁定（等待15分钟）

### 问题 2：日志不显示

**症状**：登录成功但看不到日志

**解决方案**：
1. 检查 `backend/logs/` 目录权限
2. 确认日志文件存在
3. 查看浏览器控制台错误

### 问题 3：Token 过期

**症状**：30分钟后无法访问日志

**解决方案**：
1. 重新登录获取新 Token
2. 调整 `TOKEN_EXPIRY` 常量

---

## 📚 总结

维护模式日志系统提供了：

✅ **安全性**：密码保护、失败限制、Token 认证
✅ **实用性**：多类别、过滤、搜索、导出
✅ **可靠性**：自动清理、异步写入、错误处理
✅ **易用性**：友好界面、实时刷新、快速操作

通过这个系统，你可以：
- 安全地访问系统日志
- 快速定位问题
- 监控系统状态
- 执行维护操作

---

## 📞 支持

如有问题，请检查：
1. 后端控制台输出
2. 浏览器开发者工具
3. 日志文件内容

技术细节请参考：
- 后端：`backend/src/middleware/maintenance.middleware.ts`
- 前端：`frontend/src/components/MaintenancePanel.tsx`
