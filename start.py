#!/usr/bin/env python3
"""
INK.SPIRIT Blog 一键启动脚本

用法:
    python start.py              # 默认开发模式
    python start.py dev          # 开发模式（前后端热更新）
    python start.py preview      # 预览模式（先构建再启动）
    python start.py docker       # Docker Compose 全量启动
    python start.py stop         # 停止所有服务
    python start.py init         # 仅初始化环境（安装依赖 + 数据库）
"""

import os
import re
import sys
import shutil
import socket
import signal
import subprocess
import time
import argparse
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

# ── 路径 ───────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
AI_SERVICE_DIR = ROOT_DIR / "ai-service"

# ── 从 .env 读取端口 ──────────────────────────────────────
def read_backend_port():
    """从 backend/.env 读取 PORT，默认 3001"""
    env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            m = re.match(r'^PORT\s*=\s*(\d+)', line.strip())
            if m:
                return int(m.group(1))
    return 3001

BACKEND_PORT = read_backend_port()

# ── Windows 终端颜色 ──────────────────────────────────────
if sys.platform == "win32":
    os.system("")  # 启用 ANSI 转义序列

C_RESET  = "\033[0m"
C_RED    = "\033[31m"
C_GREEN  = "\033[32m"
C_YELLOW = "\033[33m"
C_CYAN   = "\033[36m"
C_MAGENTA= "\033[35m"
C_WHITE  = "\033[37m"
C_GRAY   = "\033[90m"
C_BOLD   = "\033[1m"

def log_title(msg): print(f"\n  {C_BOLD}{C_MAGENTA}{msg}{C_RESET}")
def log_ok(msg):    print(f"  {C_GREEN}[OK]{C_RESET} {msg}")
def log_warn(msg):  print(f"  {C_YELLOW}[!!]{C_RESET} {msg}")
def log_err(msg):   print(f"  {C_RED}[XX]{C_RESET} {msg}")
def log_info(msg):  print(f"       {C_GRAY}{msg}{C_RESET}")
def log_step(msg):  print(f"  {C_CYAN}[..]{C_RESET} {msg}", end="", flush=True)
def log_step_ok(msg): print(f"\r  {C_GREEN}[OK]{C_RESET} {msg}")

# ── Banner ─────────────────────────────────────────────────
def show_banner():
    print(f"""
  {C_CYAN}╔════════════════════════════════════════════╗
  ║                                            ║
  ║{C_MAGENTA}       ██╗██████╗ ███████╗                  {C_CYAN}║
  ║{C_MAGENTA}       ██║██╔══██╗██╔════╝                  {C_CYAN}║
  ║{C_MAGENTA}       ██║██║  ██║█████╗                    {C_CYAN}║
  ║{C_MAGENTA}       ██║██║  ██║██╔══╝                    {C_CYAN}║
  ║{C_MAGENTA}       ██║██████╔╝███████╗                  {C_CYAN}║
  ║{C_MAGENTA}       ╚═╝╚═════╝ ╚══════╝                  {C_CYAN}║
  ║                                            ║
  ║{C_WHITE}         INK.SPIRIT Blog Starter            {C_CYAN}║
  ║                                            ║
  ╚════════════════════════════════════════════╝{C_RESET}
""")

# ── 工具函数 ───────────────────────────────────────────────
def run(cmd, cwd=None, capture=False):
    """运行命令，返回 CompletedProcess"""
    shell = isinstance(cmd, str)
    return subprocess.run(
        cmd, cwd=cwd, shell=shell,
        capture_output=capture, text=True,
        timeout=300
    )

def run_bg(cmd, cwd=None):
    """后台启动进程，返回 Popen，实时输出日志"""
    shell = isinstance(cmd, str)
    flags = 0
    if sys.platform == "win32":
        flags |= subprocess.CREATE_NEW_PROCESS_GROUP
    proc = subprocess.Popen(
        cmd, cwd=cwd, shell=shell,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        creationflags=flags,
        encoding='utf-8',
        errors='replace',
    )
    # 在后台线程中实时打印子进程输出
    import threading
    def _pipe_output(p):
        try:
            for line in p.stdout:
                print(f"  {C_GRAY}{line.rstrip()}{C_RESET}", flush=True)
        except ValueError:
            pass
    t = threading.Thread(target=_pipe_output, args=(proc,), daemon=True)
    t.start()
    return proc

def command_exists(cmd):
    """检查命令是否存在"""
    return shutil.which(cmd) is not None

def port_in_use(port):
    """检查端口是否被监听"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0

def kill_port(port):
    """杀掉占用端口的进程"""
    if sys.platform == "win32":
        r = run(f'netstat -ano | findstr ":{port} " | findstr LISTENING', capture=True)
        pids = set()
        for line in r.stdout.strip().splitlines():
            parts = line.strip().split()
            if parts:
                pid = parts[-1]
                if pid.isdigit() and pid != "0":
                    pids.add(pid)
        for pid in pids:
            log_warn(f"终止 PID {pid} (端口 {port})")
            run(f"taskkill /F /PID {pid}", capture=True)
    else:
        run(f"lsof -ti:{port} | xargs kill -9 2>/dev/null", shell=True, capture=True)
    # 等待端口释放，最多 5 秒
    for _ in range(10):
        if not port_in_use(port):
            return
        time.sleep(0.5)

def wait_for_url(url, timeout=30):
    """等待 URL 可访问"""
    for i in range(timeout):
        try:
            resp = urlopen(url, timeout=2)
            if resp.status == 200:
                return True
        except (URLError, OSError):
            pass
        time.sleep(1)
    return False

def wait_for_port(port, timeout=20):
    """等待端口被监听"""
    for i in range(timeout):
        if port_in_use(port):
            return True
        time.sleep(1)
    return False

# ── 环境检查 ───────────────────────────────────────────────
def check_prerequisites():
    log_title("环境检查")

    # Node.js
    log_step("Node.js ")
    if command_exists("node"):
        ver = run("node --version", capture=True).stdout.strip()
        log_step_ok(f"Node.js {ver}")
    else:
        log_err("未安装 Node.js，请先安装 https://nodejs.org")
        sys.exit(1)

    # npm
    log_step("npm ")
    if command_exists("npm"):
        ver = run("npm --version", capture=True).stdout.strip()
        log_step_ok(f"npm {ver}")
    else:
        log_err("未找到 npm")
        sys.exit(1)

    # PostgreSQL
    log_step("PostgreSQL ")
    pg_running = port_in_use(5432)
    if pg_running:
        log_step_ok("PostgreSQL 端口 5432 已监听")
    else:
        log_warn("PostgreSQL 未运行")
        log_info("请先启动 PostgreSQL 服务，或使用 docker 模式: python start.py docker")

    # Python
    log_step("Python (AI Service, 可选) ")
    py_cmd = None
    for cmd in ("python", "python3"):
        if command_exists(cmd):
            py_cmd = cmd
            break
    if py_cmd:
        ver = run(f"{py_cmd} --version", capture=True).stdout.strip()
        log_step_ok(ver)
    else:
        log_warn("未安装 Python，AI 服务将不可用")

# ── 检查 .env ─────────────────────────────────────────────
def init_env_files():
    log_title("环境配置")

    configs = [
        (BACKEND_DIR, "后端"),
        (FRONTEND_DIR, "前端"),
        (AI_SERVICE_DIR, "AI 服务"),
    ]
    for d, name in configs:
        env_path = d / ".env"
        example_path = d / ".env.example"
        if env_path.exists():
            log_ok(f"{name} .env 已存在")
        elif example_path.exists():
            shutil.copy2(example_path, env_path)
            log_warn(f"{name} .env 已从 .env.example 创建，请检查配置")
        else:
            log_info(f"{name} 无 .env 文件")

# ── 安装依赖 ───────────────────────────────────────────────
def install_dependencies():
    log_title("依赖检查")

    dirs = [
        (ROOT_DIR, "根目录"),
        (FRONTEND_DIR, "前端"),
        (BACKEND_DIR, "后端"),
    ]
    for d, name in dirs:
        pkg = d / "package.json"
        modules = d / "node_modules"
        if not pkg.exists():
            continue

        log_step(f"{name} node_modules ")
        if modules.exists():
            log_step_ok(f"{name} 依赖已安装")
        else:
            print()
            log_info(f"安装 {name} 依赖...")
            r = run("npm install", cwd=str(d))
            if modules.exists():
                log_ok(f"{name} 依赖安装完成")
            else:
                log_err(f"{name} 依赖安装失败")
                sys.exit(1)

    # Prisma Client
    log_step("Prisma Client ")
    prisma_client = BACKEND_DIR / "node_modules" / ".prisma" / "client" / "index.js"
    if prisma_client.exists():
        log_step_ok("Prisma Client 已生成")
    else:
        print()
        log_info("生成 Prisma Client...")
        run("npx prisma generate", cwd=str(BACKEND_DIR))
        log_ok("Prisma Client 已生成")

# ── 端口检查 ───────────────────────────────────────────────
def init_ports():
    log_title("端口检查")

    for port in (3000, BACKEND_PORT):
        log_step(f"端口 {port} ")
        if port_in_use(port):
            log_warn(f"端口 {port} 被占用，正在释放...")
            kill_port(port)
            if port_in_use(port):
                log_err(f"无法释放端口 {port}，请手动处理")
                sys.exit(1)
            log_ok(f"端口 {port} 已释放")
        else:
            log_step_ok(f"端口 {port} 可用")

# ── 停止服务 ───────────────────────────────────────────────
def stop_services():
    log_title("停止服务")

    services = [(3000, "前端"), (BACKEND_PORT, "后端"), (8000, "AI 服务")]
    for port, name in services:
        log_step(f"{name} (端口 {port}) ")
        if port_in_use(port):
            kill_port(port)
            log_ok(f"{name} 已停止")
        else:
            log_ok(f"{name} 未运行")

    # Docker
    log_step("Docker 容器 ")
    if command_exists("docker"):
        r = run('docker ps --filter "name=ink-spirit" --format "{{.Names}}"', capture=True)
        if r.stdout.strip():
            run("docker compose down", cwd=str(ROOT_DIR))
            log_ok("Docker 容器已停止")
        else:
            log_ok("无运行中的 Docker 容器")
    else:
        log_info("Docker 未安装，跳过")

    print()
    log_ok("所有服务已停止")

# ── Docker 模式 ────────────────────────────────────────────
def start_docker():
    log_title("Docker Compose 启动")

    if not command_exists("docker"):
        log_err("未安装 Docker，请先安装 Docker Desktop")
        sys.exit(1)

    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        example = ROOT_DIR / ".env.example"
        if example.exists():
            shutil.copy2(example, env_path)
            log_warn(".env 已从 .env.example 创建，请编辑后再启动")
            log_info("需要修改: POSTGRES_PASSWORD, JWT_SECRET, MINIO_ROOT_PASSWORD")
            log_info("编辑完成后再次运行: python start.py docker")
            sys.exit(0)

    run("docker compose up -d", cwd=str(ROOT_DIR))
    print()
    log_ok("Docker 服务已启动")
    print(f"""
  {C_CYAN}  前端:         http://localhost:3000
  后端 API:     http://localhost:{BACKEND_PORT}
  AI 服务:      http://localhost:8000
  MinIO 控制台: http://localhost:9001{C_RESET}
""")

# ── 显示运行状态 ───────────────────────────────────────────
def show_status(mode):
    label = "开发模式" if mode == "dev" else "预览模式"
    print(f"""
  {C_GREEN}══════════════════════════════════════════════
    服务已启动 - {label}
  ════════════════════════════════════════════{C_RESET}

  {C_CYAN}  前端:   http://localhost:3000
  后端:   http://localhost:{BACKEND_PORT}
  管理:   http://localhost:3000/admin/login{C_RESET}

  {C_GRAY}══════════════════════════════════════════════
    停止服务: python start.py stop
  ════════════════════════════════════════════{C_RESET}
""")

# ── 开发模式 ───────────────────────────────────────────────
def start_dev():
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    log_title("启动服务")

    # 后端
    log_step("启动后端 ")
    backend_proc = run_bg("npm run dev", cwd=str(BACKEND_DIR))
    log_step_ok(f"后端启动中 (PID {backend_proc.pid})")

    log_info("等待后端就绪...")
    if wait_for_url(f"http://localhost:{BACKEND_PORT}/api/health", timeout=30):
        log_ok("后端已就绪")
    else:
        log_warn("后端未响应，可能还在启动中")

    # AI 服务（可选，未配置 API Key 时占位回复）
    log_step("启动 AI 服务 ")
    ai_service_dir = ROOT_DIR / "ai-service"
    ai_proc = None
    if ai_service_dir.exists() and (ai_service_dir / "main.py").exists():
        # 优先用 venv，否则用系统 Python
        venv_python = ai_service_dir / ".venv" / "Scripts" / "python.exe"
        py_cmd = str(venv_python) if venv_python.exists() else "python"
        try:
            ai_proc = run_bg(f"{py_cmd} main.py", cwd=str(ai_service_dir))
            log_step_ok(f"AI 服务启动中 (PID {ai_proc.pid})")
            if not port_in_use(8000):
                time.sleep(1)
        except Exception as e:
            log_warn(f"AI 服务启动失败: {e}")
    else:
        log_warn("AI 服务未找到，跳过（AiCompanion 仍可显示占位回复）")

    # 前端
    log_step("启动前端 ")
    frontend_proc = run_bg("npm run dev", cwd=str(FRONTEND_DIR))
    log_step_ok(f"前端启动中 (PID {frontend_proc.pid})")

    log_info("等待前端就绪...")
    if wait_for_port(3000, timeout=20):
        log_ok("前端已就绪")
    else:
        log_warn("前端未响应，可能还在启动中")

    show_status("dev")

    # 保持脚本运行，等待子进程退出
    try:
        while True:
            # 检查子进程是否还活着
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                break
            if ai_proc and ai_proc.poll() is not None:
                log_warn(f"AI 服务已退出 (退出码 {ai_proc.returncode})")
                ai_proc = None  # AI 服务退出不终止整个启动脚本
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到 Ctrl+C，正在停止服务...")
        backend_proc.terminate()
        frontend_proc.terminate()
        if ai_proc:
            ai_proc.terminate()
        log_ok("服务已停止")

# ── 预览模式 ───────────────────────────────────────────────
def start_preview():
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    log_title("构建前端")
    r = run("npm run build", cwd=str(FRONTEND_DIR))
    if (FRONTEND_DIR / "dist").exists():
        log_ok("前端构建完成")
    else:
        log_err("前端构建失败")
        sys.exit(1)

    log_title("启动服务")

    log_step("启动后端 ")
    backend_proc = run_bg("npm run dev", cwd=str(BACKEND_DIR))
    log_step_ok(f"后端启动中 (PID {backend_proc.pid})")

    time.sleep(3)

    log_step("启动前端预览 ")
    frontend_proc = run_bg("npm run preview", cwd=str(FRONTEND_DIR))
    log_step_ok(f"前端预览启动中 (PID {frontend_proc.pid})")

    show_status("preview")

    try:
        while True:
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                break
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到 Ctrl+C，正在停止服务...")
        backend_proc.terminate()
        frontend_proc.terminate()
        log_ok("服务已停止")

# ── 内网穿透分享模式 ───────────────────────────────────────
def start_share():
    """开发模式 + Cloudflare Quick Tunnel：生成公网链接发给朋友预览"""
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    log_title("启动服务")

    # 后端
    log_step("启动后端 ")
    backend_proc = run_bg("npm run dev", cwd=str(BACKEND_DIR))
    log_step_ok(f"后端启动中 (PID {backend_proc.pid})")

    log_info("等待后端就绪...")
    if wait_for_url(f"http://localhost:{BACKEND_PORT}/api/health", timeout=30):
        log_ok("后端已就绪")
    else:
        log_warn("后端未响应，可能还在启动中")

    # 前端
    log_step("启动前端 ")
    frontend_proc = run_bg("npm run dev", cwd=str(FRONTEND_DIR))
    log_step_ok(f"前端启动中 (PID {frontend_proc.pid})")

    log_info("等待前端就绪...")
    if wait_for_port(3000, timeout=20):
        log_ok("前端已就绪")
    else:
        log_warn("前端未响应，可能还在启动中")

    # Cloudflare Quick Tunnel
    log_step("Cloudflare 隧道 ")
    tunnel_url = None
    tunnel_proc = None
    if command_exists("cloudflared"):
        tunnel_proc = subprocess.Popen(
            ["cloudflared", "tunnel", "--url", "http://localhost:3000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            encoding="utf-8",
            errors="replace",
        )
        # 等 cloudflared 打印出 trycloudflare.com URL
        import threading
        tunnel_ready = threading.Event()

        def _read_tunnel():
            nonlocal tunnel_url
            for line in tunnel_proc.stdout:
                print(f"  {C_GRAY}{line.rstrip()}{C_RESET}", flush=True)
                m = re.search(r"https://[a-zA-Z0-9.-]+\.trycloudflare\.com", line)
                if m and not tunnel_ready.is_set():
                    tunnel_url = m.group(0)
                    tunnel_ready.set()

        threading.Thread(target=_read_tunnel, daemon=True).start()

        tunnel_ready.wait(timeout=30)
        if tunnel_url:
            log_step_ok(f"隧道已建立")
        else:
            log_warn("隧道建立超时，请检查网络或手动启动 cloudflared")
    else:
        log_warn("cloudflared 未安装，跳过隧道")
        log_info("安装: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")

    # 显示状态
    print(f"""
  {C_GREEN}══════════════════════════════════════════════
    服务已启动 - 分享模式
  ════════════════════════════════════════════{C_RESET}

  {C_CYAN}  本地前端: http://localhost:3000
  本地后端: http://localhost:{BACKEND_PORT}""")
    if tunnel_url:
        print(f"""
  {C_YELLOW}  公网链接 (发给朋友):
  {C_WHITE}  {tunnel_url}{C_RESET}""")
    print(f"""
  {C_GRAY}══════════════════════════════════════════════
    停止服务: python start.py stop
  ════════════════════════════════════════════{C_RESET}
""")

    # 监控所有进程
    try:
        while True:
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                break
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到 Ctrl+C，正在停止服务...")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            tunnel_proc.terminate()
        except Exception:
            pass
        log_ok("服务已停止")


# ── 仅初始化 ───────────────────────────────────────────────
def start_init():
    check_prerequisites()
    init_env_files()
    install_dependencies()

    log_title("数据库初始化")

    log_step("同步数据库 Schema ")
    run("npx prisma db push --skip-generate", cwd=str(BACKEND_DIR))
    log_ok("Schema 同步完成")

    log_step("生成种子数据 ")
    run("npm run db:seed", cwd=str(BACKEND_DIR))
    log_ok("种子数据已生成")

    print()
    log_ok("初始化完成! 运行 python start.py dev 开始开发")

# ── 主入口 ─────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="INK.SPIRIT Blog 一键启动脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python start.py              # 默认开发模式
  python start.py dev          # 开发模式（前后端热更新）
  python start.py preview      # 预览模式（先构建再启动）
  python start.py docker       # Docker Compose 全量启动
  python start.py stop         # 停止所有服务
  python start.py init         # 仅初始化环境（安装依赖 + 数据库）
"""
    )
    parser.add_argument(
        "mode", nargs="?", default="dev",
        choices=["dev", "preview", "docker", "stop", "init", "share"],
        help="启动模式 (默认: dev)；share = 开发模式 + Cloudflare 隧道分享"
    )
    args = parser.parse_args()

    show_banner()

    actions = {
        "dev":     start_dev,
        "preview": start_preview,
        "docker":  start_docker,
        "stop":    stop_services,
        "init":    start_init,
        "share":   start_share,
    }
    actions[args.mode]()

if __name__ == "__main__":
    main()
