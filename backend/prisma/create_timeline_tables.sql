-- 手动创建 CurrentStatus 和 HistoryItem 表
-- 执行方式: 在 PostgreSQL 中运行此脚本

-- 创建 CurrentStatus 表
CREATE TABLE IF NOT EXISTS "current_status" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currentFocus" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "vibe" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💻',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "current_status_pkey" PRIMARY KEY ("id")
);

-- 创建 CurrentStatus 索引
CREATE INDEX IF NOT EXISTS "current_status_isActive_idx" ON "current_status"("isActive");

-- 创建 HistoryItem 表
CREATE TABLE IF NOT EXISTS "history_items" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT NOT NULL DEFAULT '#a855f7',
    "icon" TEXT NOT NULL DEFAULT 'FileText',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_items_pkey" PRIMARY KEY ("id")
);

-- 创建 HistoryItem 索引
CREATE INDEX IF NOT EXISTS "history_items_order_idx" ON "history_items"("order");
CREATE INDEX IF NOT EXISTS "history_items_isActive_idx" ON "history_items"("isActive");

-- 插入默认 CurrentStatus 数据
INSERT INTO "current_status" ("id", "title", "currentFocus", "location", "vibe", "emoji", "isActive", "createdAt", "updatedAt")
VALUES (
    'default_status_001',
    'BUILDING THE FUTURE',
    'Learning Next.js & Rust',
    'Neo-City, Sector 7',
    '💻 Coding / ☕ Coffee',
    '💻',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- 插入默认 HistoryItem 数据
INSERT INTO "history_items" ("id", "date", "title", "role", "description", "duration", "location", "tags", "color", "icon", "order", "isActive")
VALUES 
(
    'hist_001',
    '2023年6月',
    '个人博客项目',
    '全栈开发',
    '从零开始搭建个人博客系统，包括前端页面设计、后端API开发、数据库设计和部署上线',
    '9个月2天',
    '远程',
    ARRAY['项目经历', 'MongoDB', 'Node.js', 'Vercel', 'Tailwind CSS', 'React'],
    '#a855f7',
    'FileText',
    0,
    true
),
(
    'hist_002',
    '2023年3月',
    '机器学习项目',
    '数据分析与建模',
    '参与客户数据分析项目，负责数据清洗、特征工程和模型构建',
    '5个月8天',
    '上海',
    ARRAY['项目经历', 'Python', 'Pandas', '数据可视化', 'Scikit-learn', 'TensorFlow'],
    '#3b82f6',
    'Briefcase',
    1,
    true
),
(
    'hist_003',
    '2022年3月',
    'Python 数据分析',
    '入门学习',
    '系统学习 Python 数据分析生态，掌握 NumPy, Pandas 等核心库的使用。',
    '持续进行',
    '自学',
    ARRAY['项目经历', 'Python', 'Data'],
    '#a855f7',
    'FileText',
    2,
    true
)
ON CONFLICT ("id") DO NOTHING;
