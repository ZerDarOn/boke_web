@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════╗
echo ║      INK.SPIRIT Tunnel Manager            ║
echo ╚════════════════════════════════════════════╝
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 读取配置
for /f "tokens=2 delims=:" %%a in ('findstr "provider" config.json') do (
    set provider=%%a
    set provider=!provider:"=!
    set provider=!provider:,=!
    set provider=!provider: =!
)

if "%provider%"=="" set provider=cloudflare

echo 当前隧道提供商: %provider%
echo.

:: 启动对应的隧道
if "%provider%"=="cloudflare" (
    echo 正在启动 Cloudflare Tunnel...
    node cloudflare.js
) else if "%provider%"=="ngrok" (
    echo 正在启动 ngrok Tunnel...
    node ngrok.js
) else (
    echo ❌ 未知的隧道提供商: %provider%
    echo    请编辑 config.json 修改 provider 为 cloudflare 或 ngrok
    pause
    exit /b 1
)

pause
