# INK.SPIRIT Blog

> 赛博武侠风格的个人博客系统 (Cyber-Wuxia Personal Blog)

## 项目结构

```
ink-spirit-blog/
├── frontend/           # React + TypeScript 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   ├── App.tsx        # 应用入口
│   │   ├── constants.ts   # 静态数据（待迁移到后端）
│   │   └── types.ts       # TypeScript 类型定义
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/            # Node.js + Express 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── controllers/   # 控制器逻辑
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/    # 中间件
│   │   ├── config/        # 配置文件
│   │   └── app.ts         # Express 应用
│   ├── prisma/            # 数据库 Schema (Prisma)
│   ├── tests/             # 测试文件
│   ├── package.json
│   └── tsconfig.json
│
├── shared/             # 前后端共享类型（可选）
├── docs/               # 文档
│   └── BACKEND_API_SPEC.md  # API 规范
└── package.json        # 根项目配置
```

## 快速开始

### 安装依赖

```bash
# 安装所有依赖（前端+后端+根项目）
npm run install:all

# 或者分别安装
cd frontend && npm install
cd ../backend && npm install
```

### 开发模式

```bash
# 同时启动前端和后端（推荐）
npm run dev

# 或者分别启动
cd frontend && npm run dev    # 前端: http://localhost:3000
cd backend && npm run dev     # 后端: http://localhost:3001
```

### 构建

```bash
# 构建前后端
npm run build
```

## 技术栈

### 前端
- React 19 + TypeScript
- Vite (构建工具)
- React Router DOM (路由)
- Tailwind CSS (样式)
- Lucide React (图标)

### 后端
- Node.js + Express
- TypeScript
- Prisma (ORM)
- PostgreSQL (数据库)

## API 文档

后端 API 规范详见: [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md)

## 开发状态

- [x] 前端页面开发
- [x] 路由配置
- [x] 后端项目结构
- [ ] 数据库设计
- [ ] API 实现
- [ ] 前后端联调

## 作者

**CYBER.RONIN**

---

*INK.SPIRIT © 2024*
