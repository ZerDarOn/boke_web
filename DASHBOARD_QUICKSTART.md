# 仪表盘系统 - 快速上手指南

## 🚀 快速开始

### 1. 启动服务

```bash
# 方式 1：使用 npm run dev（推荐）
cd ink-spirit-blog
npm run dev

# 方式 2：分别启动
cd ink-spirit-blog/backend
npm run dev

# 新终端
cd ink-spirit-blog/frontend
npm run dev
```

### 2. 访问应用

#### 仪表盘
```
http://localhost:3000/dashboard
```

#### 维护模式
```
http://localhost:3000/maintenance
密码：admin123
```

---

## 📊 仪表盘功能

### 模块概览

| 模块 | 位置 | 功能 |
|------|------|------|
| 系统状态 | 第 1 行 | 运行时间、数据库连接、存储使用率 |
| 流量统计 | 第 2 行 | 总请求数、访问量、流量趋势柱状图 |
| 内容统计 | 第 3 行 | 文章、照片、日记数量 |
| 互动数据 | 第 4 行 | 点赞、收藏、评论数 |
| 内容分布 | 第 5 行 | 圆环图显示内容分布 |
| 评论统计 | 第 6 行 | 圆环图显示评论分布 |
| 热门内容 | 第 7 行 | Top 5 热门文章 |
| 特色项目 | 第 8 行 | Top 3 特色项目 |

### 数据来源

- **运行时间**：从第一篇文章创建时间计算
- **请求数**：从 SiteStats 表获取（pageViews）
- **访问量**：从 SiteStats 表获取（uniqueVisitors）
- **流量趋势**：从 SiteStats 表获取最近 7 天数据
- **点赞数**：从 Posts 表聚合（likeCount）
- **收藏数**：从 Anime 表统计（favorite=true）
- **评论数**：从 Comments 和 PhotoComments 表聚合

---

## 🔧 维护模式功能

### 登录

```
默认密码：admin123

修改密码：编辑 backend/.env
MAINTENANCE_PASSWORD="your-secure-password"
```

### 日志类别

- **Maintenance**：维护操作日志
- **System**：系统事件日志
- **API**：API 请求日志
- **Database**：数据库操作日志

### 日志级别

- **info**：一般信息（蓝色）
- **warn**：警告信息（黄色）
- **error**：错误信息（红色）
- **debug**：调试信息（紫色）

### 功能

- 🔍 搜索：按内容搜索日志
- 🎨 过滤：按级别过滤日志
- 🔄 刷新：实时刷新日志
- 📥 导出：导出 JSON 格式
- 🗑️ 清空：清空日志（保留最近 10 条）

---

## 📁 项目结构

### 后端

```
backend/
├── src/
│   ├── middleware/
│   │   └── maintenance.middleware.ts  # 认证中间件
│   ├── controllers/
│   │   └── maintenance.controller.ts  # 日志控制器
│   ├── services/
│   │   └── dashboard.service.ts       # 仪表盘服务
│   ├── routes/
│   │   ├── dashboard.ts               # 仪表盘路由
│   │   └── maintenance.ts            # 维护模式路由
│   ├── lib/
│   │   ├── logger.ts                 # 日志记录工具
│   │   └── prisma.ts                 # 数据库客户端
│   └── app.ts                       # 应用入口
├── logs/                             # 日志文件存储
│   ├── maintenance.log
│   ├── system.log
│   ├── api.log
│   └── database.log
└── .env                              # 环境变量配置
```

### 前端

```
frontend/
├── src/
│   ├── components/
│   │   ├── SystemDashboard.tsx        # 仪表盘组件
│   │   └── MaintenancePanel.tsx         # 维护面板组件
│   ├── lib/
│   │   ├── api.ts                    # API 客户端
│   │   └── maintenance.ts             # 维护 API 客户端
│   ├── pages/
│   │   └── Dashboard.tsx               # 仪表盘页面
│   └── contexts/
│       └── LangContext.ts              # 语言上下文
└── .env                               # 环境变量配置
```

---

## 🛠️ 常用命令

### 数据库操作

```bash
cd ink-spirit-blog/backend

# 生成 Prisma Client
npx prisma generate

# 同步 schema 到数据库
npx prisma db push

# 重置数据库
npx prisma db push --force-reset

# 填充种子数据
npm run db:seed

# 快速修复（同步+生成+种子）
npm run db:fix
```

### 开发操作

```bash
# 启动开发服务器
npm run dev

# 构建后端
cd backend
npm run build

# 启动生产服务器
cd backend
npm run start

# 运行测试
npm test
```

---

## 🔍 故障排查

### 问题 1：端口被占用

```
错误：EADDRINUSE: address already in use :::3001

解决：
1. 查找占用进程：netstat -ano | findstr :3001
2. 终止进程：taskkill //F //PID <进程ID>
```

### 问题 2：数据库连接失败

```
错误：Can't reach database server at localhost:5432

解决：
1. 检查 PostgreSQL 是否运行
2. 检查 DATABASE_URL 配置
3. 确认数据库已创建
```

### 问题 3：维护模式无法登录

```
错误：Too many failed attempts

解决：
1. 等待 15 分钟（锁定时间）
2. 或修改 backend/.env 重置
   # 删除或注释 FAILED_ATTEMPTS 相关代码
```

### 问题 4：仪表盘数据不显示

```
原因：API 调用失败

解决：
1. 检查后端是否运行（端口 3001）
2. 检查浏览器控制台错误
3. 检查网络请求（F12 → Network）
```

---

## 📈 性能优化建议

### 前端

1. **使用 React.memo**
   - 包装重复渲染的组件
   - 避免不必要的重新渲染

2. **使用 useMemo**
   - 缓存计算结果
   - 避免重复计算

3. **使用 SWR**
   - 自动缓存和重新验证
   - 减少 API 调用

### 后端

1. **使用 Prisma 查询优化**
   - 选择性查询（只查询需要的字段）
   - 使用索引（已在 schema 中定义）

2. **使用连接池**
   - Prisma 内置连接池管理
   - 适当调整连接池大小

---

## 🔒 安全建议

### 生产环境

1. **修改默认密码**
   ```env
   MAINTENANCE_PASSWORD="your-secure-password"
   ```

2. **使用环境变量**
   - 不要将敏感信息提交到 Git
   - 使用 `.env.example` 作为模板

3. **启用 HTTPS**
   - 使用 Let's Encrypt 或其他 SSL 证书
   - 强制 HTTPS 重定向

4. **设置 CSP 头**
   - 已在 helmet 中配置
   - 防止 XSS 攻击

---

## 📞 获取帮助

### 文档

- **仪表盘改进**：`DASHBOARD_IMPROVEMENTS.md`
- **维护模式指南**：`MAINTENANCE_MODE_GUIDE.md`
- **部署指南**：`MAINTENANCE_DEPLOYMENT.md`
- **测试报告**：`MAINTENANCE_TEST_REPORT.md`
- **复盘报告**：`DASHBOARD_REVIEW.md`
- **最终总结**：`DASHBOARD_FINAL_SUMMARY.md`
- **测试清单**：`DASHBOARD_TEST_CHECKLIST.md`

### 常见问题

1. **如何修改维护密码？**
   编辑 `backend/.env`，设置 `MAINTENANCE_PASSWORD`

2. **如何重置数据库？**
   运行 `npm run db:fix` 或 `npx prisma db push --force-reset`

3. **如何查看日志？**
   访问 `http://localhost:3000/maintenance`

4. **如何导出日志？**
   在维护面板点击 "EXPORT" 按钮

---

## 🎯 总结

### 核心功能

✅ **仪表盘**：
- 8 个核心模块
- 真实数据来源
- 实时数据刷新

✅ **维护模式**：
- 密码保护
- 多类别日志
- 完整的管理功能

### 技术栈

- **前端**：React + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **后端**：Node.js + Express + Prisma + PostgreSQL
- **认证**：Token 认证 + 失败限制

### 系统状态

🟢 **后端**：运行正常  
🟢 **前端**：运行正常  
🟢 **数据库**：同步完成  
🟢 **日志系统**：完全可用

---

**系统已准备就绪，开始使用吧！** 🚀
