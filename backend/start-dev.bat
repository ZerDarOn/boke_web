@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   INK.SPIRIT Backend 启动脚本
echo ========================================
echo.

:: 检查 node_modules
if not exist "node_modules" (
    echo [!] 未检测到 node_modules，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [X] 依赖安装失败，请检查网络连接或 npm 配置
        pause
        exit /b 1
    )
    echo [√] 依赖安装完成
    echo.
)

:: 检查 .env 文件
if not exist ".env" (
    echo [!] 未找到 .env 文件
    echo [i] 正在从 .env.example 复制...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [√] 已创建 .env 文件，请配置数据库信息
    ) else (
        echo [X] 未找到 .env.example 文件
    )
    echo.
    pause
    exit /b 1
)

:: 检查数据库连接
echo [i] 检查数据库连接...
node -e "require('pg').Client({host:'localhost',port:5432,user:'postgres',password:process.env.DATABASE_PASSWORD||'postgres',database:'postgres'}).connect().then(()=>console.log('[√] 数据库连接成功'),err=>{console.log('[X] 数据库连接失败');console.log('错误:',err.message);process.exit(1)})" 2>nul

if errorlevel 1 (
    echo.
    echo [!] 数据库连接失败
    echo.
    echo 💡 可能的原因：
    echo    1. PostgreSQL 服务未启动
    echo    2. 数据库密码不正确
    echo    3. 数据库不存在
    echo.
    echo 🔧 解决方案：
    echo    1. 启动 PostgreSQL: services.msc -> PostgreSQL -> 启动
    echo    2. 检查 .env 文件中的 DATABASE_URL
    echo    3. 运行: npx tsx scripts/find-password.ts 查找密码
    echo    4. 运行: npx tsx scripts/create-db-final.ts 创建数据库
    echo.
    pause
    exit /b 1
)

:: 检查端口占用
echo [i] 检查端口 3001...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1

if not errorlevel 1 (
    echo [!] 端口 3001 已被占用
    echo.
    echo 📊 占用端口的进程：
    netstat -ano | findstr ":3001.*LISTENING"
    echo.
    echo 🔧 解决方案：
    echo    1. 关闭占用端口的进程：
    echo       for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do taskkill /F /PID %%a
    echo    2. 或者修改 .env 中的 PORT 环境变量
    echo.
    set /p choice="是否自动关闭占用端口的进程？(y/n): "
    if /i "!choice!"=="y" (
        echo [i] 正在关闭进程...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
            echo     正在关闭 PID: %%a
            taskkill /F /PID %%a >nul 2>&1
        )
        echo [√] 进程已关闭
    ) else (
        echo [i] 请手动关闭占用端口的进程后重试
        pause
        exit /b 1
    )
    echo.
)

:: 生成 Prisma Client
echo [i] 生成 Prisma Client...
call npm run db:generate
if errorlevel 1 (
    echo [X] Prisma Client 生成失败
    pause
    exit /b 1
)
echo [√] Prisma Client 已生成
echo.

:: 推送数据库 schema
echo [i] 同步数据库 schema...
call npm run db:push
if errorlevel 1 (
    echo [X] 数据库同步失败
    pause
    exit /b 1
)
echo [√] 数据库同步完成
echo.

:: 启动开发服务器
echo [√] 开始启动开发服务器...
echo.
echo ========================================
echo   服务器启动中...
echo ========================================
echo.

call npm run dev

:: 如果服务器异常退出
if errorlevel 1 (
    echo.
    echo [X] 服务器异常退出
    echo.
    echo 💡 常见问题：
    echo    1. 端口占用 - 见上方解决方案
    echo    2. 数据库连接失败 - 检查 .env 配置
    echo    3. 代码错误 - 查看错误信息
    echo.
    pause
)
