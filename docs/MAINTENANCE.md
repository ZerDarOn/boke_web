# 维护模式系统文档

## 功能概述

完整的维护模式日志系统，包含：
- 密码保护的访问控制
- 失败尝试限制（5次后锁定15分钟）
- 多类别日志查看
- 日志过滤、搜索、导出
- 自动日志清理（7天保留期）

---

## 快速开始

### 1. 启动服务

```bash
# 后端
cd backend && npm run dev

# 前端（新终端）
cd frontend && npm run dev
```

### 2. 访问维护模式

**方法 1：直接访问**
```
http://localhost:3000/maintenance
```

**方法 2：从仪表盘访问**
1. 打开 `http://localhost:3000/dashboard`
2. 找到 "MAINTENANCE MODE" 模块
3. 点击 "VIEW LOG" 按钮

### 3. 登录

- **默认密码**: `admin123`
- **修改密码**: 在 `backend/.env` 中设置 `MAINTENANCE_PASSWORD`

---

## 后端实现

### 文件结构

```
backend/
├── src/
│   ├── middleware/
│   │   └── maintenance.middleware.ts  # 认证中间件
│   ├── controllers/
│   │   └── maintenance.controller.ts  # 日志控制器
│   ├── routes/
│   │   └── maintenance.ts             # 路由定义
│   └── lib/
│       └── logger.ts                  # 日志记录工具
├── logs/                              # 日志文件存储
│   ├── maintenance.log
│   ├── system.log
│   ├── api.log
│   └── database.log
└── .env                               # 环境变量
```

### 环境变量

```env
# Maintenance Mode
MAINTENANCE_MODE="false"
MAINTENANCE_PASSWORD="admin123"
```

### API 端点

#### 公开端点

```
POST /api/maintenance/login    # 登录验证
POST /api/maintenance/logout   # 登出
GET  /api/maintenance/status   # 状态检查
```

#### 保护端点（需要 Token）

```
GET  /api/maintenance/logs/:category     # 获取日志
GET  /api/maintenance/logs/search        # 搜索日志
DELETE /api/maintenance/logs/:category   # 清空日志
GET  /api/maintenance/export             # 导出日志
GET  /api/maintenance/categories         # 获取类别列表
GET  /api/maintenance/health             # 健康检查
```

---

## 前端实现

### 组件结构

```
frontend/src/
├── pages/
│   └── MaintenancePage.tsx    # 维护页面
├── lib/
│   └── api.ts                 # API 客户端
└── types/
    └── maintenance.ts         # 类型定义
```

### 功能特性

| 功能 | 说明 |
|------|------|
| 登录界面 | 密码输入、错误提示 |
| 日志列表 | 按时间排序显示 |
| 级别过滤 | info/warn/error/debug |
| 类别切换 | 4 种日志类别 |
| 内容搜索 | 模糊匹配 |
| 日志导出 | JSON 格式下载 |

---

## 认证流程

```
1. 用户输入密码
2. 后端验证密码
3. 检查失败次数（5次锁定15分钟）
4. 生成 Token（30分钟有效）
5. 返回 Token 给前端
6. 前端存储 Token 到 localStorage
7. 后续请求携带 x-maintenance-token 头
```

---

## 日志类别

| 类别 | 文件 | 说明 |
|------|------|------|
| maintenance | maintenance.log | 维护操作日志 |
| system | system.log | 系统级日志 |
| api | api.log | API 请求日志 |
| database | database.log | 数据库操作日志 |

---

## 安全机制

1. **密码保护**: 所有操作需要密码验证
2. **失败限制**: 5次失败后锁定15分钟
3. **Token 过期**: 30分钟自动过期
4. **自动清理**: 日志保留7天
5. **CORS 保护**: 限制允许的来源

---

## 测试清单

- [ ] 密码登录成功
- [ ] 错误密码提示
- [ ] 5次失败后锁定
- [ ] Token 30分钟后过期
- [ ] 日志列表显示
- [ ] 级别过滤功能
- [ ] 类别切换功能
- [ ] 搜索功能
- [ ] 导出功能
- [ ] 登出功能
