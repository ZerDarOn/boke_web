# 仪表盘系统文档

## 快速开始

### 启动服务

```bash
# 方式 1：使用根目录命令（推荐）
cd ink-spirit-blog
npm run dev

# 方式 2：分别启动
# 终端 1
cd backend && npm run dev
# 终端 2
cd frontend && npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 仪表盘 | http://localhost:3000/dashboard |
| 维护模式 | http://localhost:3000/maintenance |

---

## 功能模块

### 系统状态模块
- 运行时间（从第一篇文章创建时间计算）
- 数据库连接状态
- 存储使用率（基于内容数量动态计算）

### 流量统计模块
- 总请求数
- 访问量
- 7天流量趋势柱状图

### 内容统计模块
- 总内容数（文章+日记+相册+动漫）
- 文章数量
- 照片数量
- 日记数量

### 互动数据模块
- 点赞数
- 收藏数
- 评论数

### 可视化模块
- 内容分布圆环图（百分比动态计算）
- 评论分布圆环图（百分比动态计算）

### 热门内容模块
- Top 5 热门文章
- 按浏览量和点赞数排序

### 特色项目模块
- Top 3 特色项目
- 显示项目状态

---

## 维护模式日志系统

### 访问方式

1. **直接访问**: `http://localhost:3000/maintenance`
2. **从仪表盘**: 点击 "VIEW LOG" 按钮

### 登录信息

- **默认密码**: `admin123`
- **修改密码**: 在 `backend/.env` 中设置 `MAINTENANCE_PASSWORD`

### 功能列表

| 功能 | 说明 |
|------|------|
| 密码保护 | 默认密码 admin123 |
| 失败限制 | 5 次失败后锁定 15 分钟 |
| Token 认证 | 30 分钟有效期 |
| 多类别日志 | Maintenance, System, API, Database |
| 多级别日志 | info, warn, error, debug |
| 日志过滤 | 按级别过滤 |
| 日志搜索 | 按内容搜索 |
| 日志导出 | 导出 JSON 格式 |
| 自动清理 | 7 天保留期 |

---

## 后端实现

### 文件结构

```
backend/src/
├── controllers/
│   └── dashboard.controller.ts   # 仪表盘控制器
│   └── maintenance.controller.ts # 维护控制器
├── services/
│   └── dashboard.service.ts      # 仪表盘服务
├── routes/
│   └── dashboard.ts              # 仪表盘路由
│   └── maintenance.ts            # 维护路由
├── middleware/
│   └── maintenance.middleware.ts # 认证中间件
└── lib/
    └── logger.ts                 # 日志工具
```

### API 端点

#### 仪表盘 API

```
GET /api/dashboard/stats    # 获取仪表盘统计数据
```

#### 维护模式 API

```
POST /api/maintenance/login          # 登录
POST /api/maintenance/logout         # 登出
GET  /api/maintenance/status         # 状态检查
GET  /api/maintenance/logs/:category # 获取日志
GET  /api/maintenance/logs/search    # 搜索日志
DELETE /api/maintenance/logs/:category # 清空日志
GET  /api/maintenance/export         # 导出日志
```

---

## 前端实现

### 文件结构

```
frontend/src/
├── pages/
│   └── SystemDashboard.tsx    # 仪表盘页面
│   └── MaintenancePage.tsx    # 维护页面
├── lib/
│   └── api.ts                 # API 客户端
└── types/
    └── dashboard.ts           # 类型定义
```

### 刷新功能

仪表盘支持手动刷新数据：
- 点击刷新按钮
- 加载动画显示

---

## 环境变量配置

在 `backend/.env` 中添加：

```env
# Maintenance Mode
MAINTENANCE_MODE="false"
MAINTENANCE_PASSWORD="admin123"
```

---

## 已修复的问题

| 问题 | 状态 |
|------|------|
| 柱状图硬编码数据 | ✅ 改为真实流量趋势 |
| 增长率硬编码 | ✅ 动态计算 |
| 存储使用率假数据 | ✅ 基于内容动态计算 |
| 圆环图固定角度 | ✅ 根据百分比动态生成 |
| CORS 缺少头 | ✅ 添加 x-maintenance-token |
| 前端类型不匹配 | ✅ 添加 trafficTrend 和 percentage |
