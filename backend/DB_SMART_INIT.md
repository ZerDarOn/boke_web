# 智能数据库自动初始化系统

## ✨ 特性

### 1. ✅ 异步执行（非阻塞）
- 使用 `spawn` 替代 `execSync`
- 不阻塞主进程
- 后端可同时启动

### 2. 🔍 智能检测
- 自动检查数据库是否存在
- 自动检查表是否存在
- 只在需要时初始化

### 3. 📦 自动创建
- 基于数据库URL自动创建数据库
- 基于 Prisma Schema 自动创建所有表
- 自动添加新字段（向后兼容）

### 4. 🔄 智能同步
- 使用 `prisma db push`
- 只创建缺失的表和字段
- 保留现有数据（不删除）
- 向后兼容

### 5. ⚙️ 灵活控制
```bash
# .env 配置
INIT_DB="true"    # 启用自动初始化
INIT_DB="false"   # 禁用（生产环境推荐）

RESET_DB="true"   # 强制重建（删除数据）
RESET_DB="false"  # 正常初始化（默认）
```

## 🎯 运行逻辑

### 首次运行
```
启动 → 检查数据库 → 创建数据库 → 同步Schema → 生成Client → 插入数据
      ↓              ↓              ↓            ↓             ↓
    空数据库      不存在        创建成功     创建表       初始化完成
```

### 后续运行
```
启动 → 检查数据库 → 跳过初始化 → 启动服务器
      ↓              ↓              ↓
    有数据        已初始化      正常运行
```

### 强制重建
```
启动 → 检查RESET_DB → 重建数据库 → 同步Schema → 生成Client → 插入数据
      ↓                ↓              ↓            ↓             ↓
    true=true      删除并创建     重新创建表    生成Client    重新初始化
```

## 📦 命令说明

### 自动初始化（推荐）
```bash
npm run dev
```
- 首次：自动初始化
- 后续：自动跳过

### 手动初始化
```bash
npm run db:init
```

### 强制重建
```bash
# 方法1：设置 RESET_DB=true
echo "RESET_DB=true" >> .env
npm run dev

# 方法2：运行重置命令
npm run db:force-reset
```

## 🔧 配置示例

### 开发环境（首次启动）
```bash
INIT_DB="true"     # 启用自动初始化
RESET_DB="false"   # 正常初始化
```

### 开发环境（需要重置）
```bash
INIT_DB="true"     # 启用自动初始化
RESET_DB="true"    # 强制重建
```

### 生产环境
```bash
INIT_DB="false"    # 禁用自动初始化
RESET_DB="false"   # 不强制重建
```

## ⚠️ 注意事项

1. **RESET_DB=true 会删除所有数据**
   - 仅在开发/测试环境使用
   - 生产环境严禁使用

2. **prisma db push 的特性**
   - 只创建缺失的表和字段
   - 不删除现有表/字段
   - 保留现有数据
   - 不适合复杂迁移（简单场景可用）

3. **生产环境建议**
   - 使用 `prisma migrate` 进行版本化迁移
   - 保存迁移历史
   - 可以回滚

## 🚀 快速开始

### 1. 首次启动
```bash
# 确保 .env 配置正确
DATABASE_URL="postgresql://postgres:password@localhost:5432/ink_spirit_db"
INIT_DB="true"
RESET_DB="false"

# 启动后端
npm run dev
```

输出：
```
🔍 Checking database status...
🔍 Checking if database "ink_spirit_db" exists...
📦 Creating database "ink_spirit_db"...
✅ Database created successfully.
🔄 Syncing database schema (async)...
✅ Database schema synced successfully.
💡 Only missing tables/fields were created (existing data preserved).
🔄 Generating Prisma Client...
✅ Prisma Client generated.
🌱 Seeding data...
✅ Seeding completed.
✨ Database initialization completed successfully!
💡 Next startup will skip initialization (unless RESET_DB=true).
```

### 2. 后续启动
```bash
npm run dev
```

输出：
```
🔍 Checking database status...
✅ Database already initialized.
💡 To reset database, set RESET_DB=true in .env or run: npm run db:reset
🚀 Server started...
```

### 3. 强制重建
```bash
# 修改 .env
RESET_DB="true"

# 启动
npm run dev
```

输出：
```
🔍 Checking database status...
⚠️  RESET_DB=true - Forcing database rebuild...
🔄 Syncing database schema (async)...
...
✨ Database force reset completed!
```

## 🎉 总结

- ✅ 异步执行，不阻塞
- ✅ 智能检测，避免重复
- ✅ 自动创建，无需手动
- ✅ 向后兼容，保留数据
- ✅ 灵活控制，按需配置
