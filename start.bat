@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:menu
cls
echo.
echo   ╔════════════════════════════════════════════════════════╗
echo   ║           INK.SPIRIT 启动器 v2.0                       ║
echo   ╚════════════════════════════════════════════════════════╝
echo.
echo   请选择启动模式:
echo.
echo   [1] 开发模式     - 热更新，方便调试
echo   [2] 预览模式     - 构建后预览，速度快（推荐演示）
echo   [3] 开发 + 隧道  - 开发模式 + 公网访问
echo   [4] 预览 + 隧道  - 预览模式 + 公网访问（推荐分享）
echo   [5] 仅构建       - 构建生产版本
echo   [6] 仅隧道       - 仅启动隧道（需先启动服务）
echo.
echo   [7] 清理残留进程 - 清理未正常退出的进程
echo   [8] 检查端口占用 - 查看端口使用情况
echo.
echo   [0] 退出
echo.
echo   ══════════════════════════════════════════════════════════
echo.

set /p choice="   请输入选项 [0-8]: "

if "%choice%"=="0" goto :end
if "%choice%"=="1" goto :dev
if "%choice%"=="2" goto :preview
if "%choice%"=="3" goto :dev-tunnel
if "%choice%"=="4" goto :preview-tunnel
if "%choice%"=="5" goto :build
if "%choice%"=="6" goto :tunnel
if "%choice%"=="7" goto :clean
if "%choice%"=="8" goto :check

echo.
echo   无效选项，请重新选择...
timeout /t 2 >nul
goto :menu

:dev
cls
echo.
echo   启动开发模式...
echo.
node "%~dp0start.js" dev
pause
goto :end

:preview
cls
echo.
echo   启动预览模式...
echo.
node "%~dp0start.js" preview
pause
goto :end

:dev-tunnel
cls
echo.
echo   启动开发模式 + 隧道...
echo.
node "%~dp0start.js" dev --tunnel
pause
goto :end

:preview-tunnel
cls
echo.
echo   启动预览模式 + 隧道...
echo.
node "%~dp0start.js" preview --tunnel
pause
goto :end

:build
cls
echo.
echo   构建生产版本...
echo.
node "%~dp0start.js" build
echo.
echo   构建完成！按任意键返回菜单...
pause >nul
goto :menu

:tunnel
cls
echo.
echo   启动隧道...
echo.
node "%~dp0tunnel\index.js"
pause
goto :end

:clean
cls
echo.
echo   清理残留进程...
echo.
node "%~dp0start.js" clean
echo.
echo   清理完成！按任意键返回菜单...
pause >nul
goto :menu

:check
cls
echo.
echo   检查端口占用情况...
echo.
echo   ══════════════════════════════════════════════════════════
echo.
echo   端口 3000 (前端):
netstat -ano | findstr ":3000" 2>nul || echo     未被占用
echo.
echo   端口 3001 (后端):
netstat -ano | findstr ":3001" 2>nul || echo     未被占用
echo.
echo   端口 3002 (备用):
netstat -ano | findstr ":3002" 2>nul || echo     未被占用
echo.
echo   ══════════════════════════════════════════════════════════
echo.
echo   按任意键返回菜单...
pause >nul
goto :menu

:end
exit /b
