#!/usr/bin/env python3
"""
INK.SPIRIT Blog 一键启动脚本

用法:
    python start.py              # 默认开发模式
    python start.py dev          # 开发模式（前后端热更新）
    python start.py preview      # 预览模式（先构建再启动）
    python start.py docker       # Docker Compose 全量启动
    python start.py doctor       # 只读检查启动环境和隧道网络
    python start.py stop         # 停止所有服务
    python start.py init         # 仅初始化环境（安装依赖 + 数据库）
"""

import os
import re
import sys
import json
import shutil
import socket
import signal
import subprocess
import time
import argparse
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

# ── 路径 ───────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
AI_SERVICE_DIR = ROOT_DIR / "ai-service"
PORT_CONFIG_PATH = ROOT_DIR / ".port-config.json"
DEFAULT_FRONTEND_PORT = 5173
DEFAULT_BACKEND_PORT = 3001
MAX_PORT_SEARCH_ATTEMPTS = 20
DEFAULT_SERVICE_START_TIMEOUT_SECONDS = 30
DEFAULT_TUNNEL_READY_TIMEOUT_SECONDS = 30
DEFAULT_TUNNEL_PROTOCOL = "http2"
SUPPORTED_TUNNEL_PROTOCOLS = {"auto", "quic", "http2"}
QUICK_TUNNEL_CREATED_MARKER = "Your quick Tunnel has been created!"
TUNNEL_CONNECTED_MARKER = "Registered tunnel connection"

def read_positive_int_env(name, default):
    raw_value = os.environ.get(name)
    if raw_value is None:
        return default
    try:
        value = int(raw_value)
    except ValueError:
        return default
    return value if value > 0 else default

def resolve_tunnel_protocol(env=os.environ):
    requested = env.get("CLOUDFLARED_PROTOCOL", "").strip().lower()
    return requested if requested in SUPPORTED_TUNNEL_PROTOCOLS else DEFAULT_TUNNEL_PROTOCOL

SERVICE_START_TIMEOUT_SECONDS = read_positive_int_env(
    "STARTUP_TIMEOUT_SECONDS",
    DEFAULT_SERVICE_START_TIMEOUT_SECONDS,
)
TUNNEL_READY_TIMEOUT_SECONDS = read_positive_int_env(
    "CLOUDFLARED_READY_TIMEOUT_SECONDS",
    DEFAULT_TUNNEL_READY_TIMEOUT_SECONDS,
)
TUNNEL_PROTOCOL = resolve_tunnel_protocol()

def is_valid_port(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 < value <= 65535

def read_saved_ports():
    try:
        config = json.loads(PORT_CONFIG_PATH.read_text(encoding="utf-8"))
        return config if isinstance(config, dict) else {}
    except (OSError, ValueError):
        return {}

# ── 从保存配置和 .env 读取端口 ────────────────────────────
def read_backend_port():
    """优先读取已选端口，再回退 backend/.env 和默认值。"""
    saved_port = read_saved_ports().get("backendPort")
    if is_valid_port(saved_port):
        return saved_port

    env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            m = re.match(r'^PORT\s*=\s*(\d+)', line.strip())
            if m and is_valid_port(int(m.group(1))):
                return int(m.group(1))
    return DEFAULT_BACKEND_PORT

def read_frontend_port():
    """从 .port-config.json 读取 frontendPort，默认 5173"""
    saved_port = read_saved_ports().get("frontendPort")
    return saved_port if is_valid_port(saved_port) else DEFAULT_FRONTEND_PORT

BACKEND_PORT = read_backend_port()
FRONTEND_PORT = read_frontend_port()

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

def run_bg(cmd, cwd=None, env_extra=None):
    """后台启动进程，返回 Popen，实时输出日志"""
    shell = isinstance(cmd, str)
    flags = 0
    if sys.platform == "win32":
        flags |= subprocess.CREATE_NEW_PROCESS_GROUP
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    proc = subprocess.Popen(
        cmd, cwd=cwd, shell=shell,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        creationflags=flags,
        encoding='utf-8',
        errors='replace',
        env=env,
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

def resolve_cloudflared_command():
    """按 Node 隧道启动器相同的优先级查找 cloudflared。"""
    configured_path = os.environ.get("CLOUDFLARED_PATH")
    if configured_path:
        return configured_path

    executable_name = "cloudflared.exe" if sys.platform == "win32" else "cloudflared"
    user_profile = os.environ.get("USERPROFILE")
    candidates = [
        Path(user_profile) / executable_name if user_profile else None,
        ROOT_DIR / executable_name,
    ]
    for candidate in candidates:
        if candidate and candidate.is_file():
            return str(candidate)
    return shutil.which("cloudflared")

def terminate_started_processes(
    processes,
    platform=sys.platform,
    taskkill_runner=subprocess.run,
):
    """尽力终止本次启动模式创建的子进程。"""
    active_processes = [
        process for process in processes
        if process is not None and process.poll() is None
    ]
    for process in active_processes:
        tree_terminated = False
        if platform == "win32" and isinstance(process.pid, int) and process.pid > 0:
            try:
                result = taskkill_runner(
                    [
                        "taskkill.exe",
                        "/PID", str(process.pid),
                        "/T",
                        "/F",
                    ],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=False,
                )
                tree_terminated = result.returncode == 0
            except OSError:
                tree_terminated = False
        if not tree_terminated:
            try:
                process.terminate()
            except OSError:
                pass
    for process in active_processes:
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            try:
                process.kill()
            except OSError:
                pass

def install_process_cleanup_handlers(processes):
    """为前台启动模式安装信号处理，并返回幂等的最终清理函数。"""
    previous_sigint_handler = signal.getsignal(signal.SIGINT)
    previous_sigterm_handler = signal.getsignal(signal.SIGTERM)
    cleaned = False

    def cleanup():
        nonlocal cleaned
        if cleaned:
            return
        cleaned = True
        terminate_started_processes(processes)

    def handle_stop(_signum, _frame):
        cleanup()
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, handle_stop)
    signal.signal(signal.SIGTERM, handle_stop)

    def finish_cleanup():
        signal.signal(signal.SIGINT, previous_sigint_handler)
        signal.signal(signal.SIGTERM, previous_sigterm_handler)
        cleanup()

    return finish_cleanup

def port_in_use(port):
    """检查端口是否被监听"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0

def port_available(port):
    """通过独占绑定检查启动器能否安全使用该端口。"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        try:
            probe.bind(("0.0.0.0", port))
            return True
        except OSError:
            return False

def select_available_ports(
    frontend_port,
    backend_port,
    is_available=port_available,
    max_attempts=MAX_PORT_SEARCH_ATTEMPTS,
):
    """选择互不冲突的前后端端口，不终止任何既有进程。"""
    def choose(start_port, excluded):
        for offset in range(max_attempts + 1):
            candidate = start_port + offset
            if is_valid_port(candidate) and candidate not in excluded and is_available(candidate):
                return candidate
        return None

    selected_frontend = choose(frontend_port, set())
    if selected_frontend is None:
        raise RuntimeError(f"前端在 {frontend_port} 之后没有可用端口")
    selected_backend = choose(backend_port, {selected_frontend})
    if selected_backend is None:
        raise RuntimeError(f"后端在 {backend_port} 之后没有可用端口")
    return selected_frontend, selected_backend

def persist_selected_ports(frontend_port, backend_port, config_path=PORT_CONFIG_PATH):
    payload = {
        "frontendPort": frontend_port,
        "backendPort": backend_port,
    }
    temp_path = config_path.with_name(f"{config_path.name}.{os.getpid()}.tmp")
    try:
        temp_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temp_path.replace(config_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()

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

def probe_http_endpoint(url, timeout=5, opener=urlopen):
    """只读探测 HTTP 端点；HTTP 错误码也表示网络链路可达。"""
    try:
        with opener(url, timeout=timeout) as response:
            return True, f"HTTP {response.status}"
    except HTTPError as error:
        return True, f"HTTP {error.code}"
    except (URLError, OSError) as error:
        return False, str(error.reason if isinstance(error, URLError) else error)

def probe_tcp_endpoint(host, port, timeout=3, connector=socket.create_connection):
    """只读探测 TCP 端点。"""
    try:
        connection = connector((host, port), timeout=timeout)
        connection.close()
        return True, f"TCP {port} 可达"
    except OSError as error:
        return False, str(error)

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
    global FRONTEND_PORT, BACKEND_PORT
    log_title("端口检查")

    requested_frontend = FRONTEND_PORT
    requested_backend = BACKEND_PORT
    try:
        FRONTEND_PORT, BACKEND_PORT = select_available_ports(
            requested_frontend,
            requested_backend,
        )
        persist_selected_ports(FRONTEND_PORT, BACKEND_PORT)
    except (OSError, RuntimeError) as error:
        log_err(str(error))
        sys.exit(1)

    for name, requested, selected in (
        ("前端", requested_frontend, FRONTEND_PORT),
        ("后端", requested_backend, BACKEND_PORT),
    ):
        if selected == requested:
            log_ok(f"{name}端口 {selected} 可用")
        else:
            log_warn(f"{name}端口 {requested} 已占用，改用 {selected}")

# ── 停止服务 ───────────────────────────────────────────────
def stop_services():
    log_title("停止服务")
    log_warn("此命令会按配置端口停止进程；正常退出请优先在启动窗口按 Ctrl+C")

    services = [(FRONTEND_PORT, "前端"), (BACKEND_PORT, "后端"), (8000, "AI 服务")]
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
  {C_CYAN}  前端:         http://localhost:{FRONTEND_PORT}
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

  {C_CYAN}  前端:   http://localhost:{FRONTEND_PORT}
  后端:   http://localhost:{BACKEND_PORT}
  管理:   http://localhost:{FRONTEND_PORT}/admin/login{C_RESET}

  {C_GRAY}══════════════════════════════════════════════
    停止服务: 当前窗口按 Ctrl+C
  ════════════════════════════════════════════{C_RESET}
""")

# ── 开发模式 ───────────────────────────────────────────────
def start_dev():
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    started_processes = []
    finish_cleanup = install_process_cleanup_handlers(started_processes)
    exit_code = 0
    try:
        log_title("启动服务")

        log_step("启动后端 ")
        backend_proc = run_bg(
            "npm run dev",
            cwd=str(BACKEND_DIR),
            env_extra={
                "PORT": str(BACKEND_PORT),
                "PRISMA_LOG_SQL": "true",
            },
        )
        started_processes.append(backend_proc)
        log_step_ok(f"后端启动中 (PID {backend_proc.pid})")
        log_info("等待后端就绪...")
        if not wait_for_url(
            f"http://127.0.0.1:{BACKEND_PORT}/api/health",
            timeout=SERVICE_START_TIMEOUT_SECONDS,
        ):
            raise RuntimeError("后端启动超时")
        log_ok("后端已就绪")

        log_step("启动 AI 服务 ")
        ai_proc = None
        if AI_SERVICE_DIR.exists() and (AI_SERVICE_DIR / "main.py").exists():
            venv_python = AI_SERVICE_DIR / ".venv" / "Scripts" / "python.exe"
            py_cmd = str(venv_python) if venv_python.exists() else "python"
            try:
                ai_proc = run_bg(f"{py_cmd} main.py", cwd=str(AI_SERVICE_DIR))
                started_processes.append(ai_proc)
                log_step_ok(f"AI 服务启动中 (PID {ai_proc.pid})")
            except OSError as error:
                log_warn(f"AI 服务启动失败: {error}")
        else:
            log_warn("AI 服务未找到，跳过（AiCompanion 仍可显示占位回复）")

        log_step("启动前端 ")
        frontend_proc = run_bg(
            "npm run dev",
            cwd=str(FRONTEND_DIR),
            env_extra={"PORT": str(FRONTEND_PORT)},
        )
        started_processes.append(frontend_proc)
        log_step_ok(f"前端启动中 (PID {frontend_proc.pid})")
        log_info("等待前端就绪...")
        if not wait_for_url(
            f"http://127.0.0.1:{FRONTEND_PORT}",
            timeout=SERVICE_START_TIMEOUT_SECONDS,
        ):
            raise RuntimeError("前端启动超时")
        log_ok("前端已就绪")

        show_status("dev")
        while True:
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                exit_code = backend_proc.returncode or 1
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                exit_code = frontend_proc.returncode or 1
                break
            if ai_proc and ai_proc.poll() is not None:
                log_warn(f"AI 服务已退出 (退出码 {ai_proc.returncode})")
                ai_proc = None
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到停止信号，正在停止服务...")
    except (OSError, RuntimeError) as error:
        log_err(str(error))
        exit_code = 1
    finally:
        finish_cleanup()
        log_ok("服务已停止")
    if exit_code:
        sys.exit(exit_code)

# ── 预览模式 ───────────────────────────────────────────────
def start_preview():
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    log_title("构建前端")
    build_result = run("npm run build", cwd=str(FRONTEND_DIR))
    if build_result.returncode == 0 and (FRONTEND_DIR / "dist").exists():
        log_ok("前端构建完成")
    else:
        log_err("前端构建失败")
        sys.exit(1)

    started_processes = []
    finish_cleanup = install_process_cleanup_handlers(started_processes)
    exit_code = 0
    try:
        log_title("启动服务")
        log_step("启动后端 ")
        backend_proc = run_bg(
            "npm run dev",
            cwd=str(BACKEND_DIR),
            env_extra={"PORT": str(BACKEND_PORT)},
        )
        started_processes.append(backend_proc)
        log_step_ok(f"后端启动中 (PID {backend_proc.pid})")
        log_info("等待后端就绪...")
        if not wait_for_url(
            f"http://127.0.0.1:{BACKEND_PORT}/api/health",
            timeout=SERVICE_START_TIMEOUT_SECONDS,
        ):
            raise RuntimeError("后端启动超时")
        log_ok("后端已就绪")

        log_step("启动前端预览 ")
        frontend_proc = run_bg(
            "npm run preview",
            cwd=str(FRONTEND_DIR),
            env_extra={"PORT": str(FRONTEND_PORT)},
        )
        started_processes.append(frontend_proc)
        log_step_ok(f"前端预览启动中 (PID {frontend_proc.pid})")
        log_info("等待前端就绪...")
        if not wait_for_url(
            f"http://127.0.0.1:{FRONTEND_PORT}",
            timeout=SERVICE_START_TIMEOUT_SECONDS,
        ):
            raise RuntimeError("前端预览启动超时")
        log_ok("前端预览已就绪")

        show_status("preview")
        while True:
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                exit_code = backend_proc.returncode or 1
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                exit_code = frontend_proc.returncode or 1
                break
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到停止信号，正在停止服务...")
    except (OSError, RuntimeError) as error:
        log_err(str(error))
        exit_code = 1
    finally:
        finish_cleanup()
        log_ok("服务已停止")
    if exit_code:
        sys.exit(exit_code)

# ── 内网穿透分享模式 ───────────────────────────────────────
def start_share():
    """开发模式 + Cloudflare Quick Tunnel：生成公网链接发给朋友预览"""
    check_prerequisites()
    init_env_files()
    install_dependencies()
    init_ports()

    started_processes = []
    finish_cleanup = install_process_cleanup_handlers(started_processes)

    log_title("启动服务")

    # 后端
    log_step("启动后端 ")
    backend_proc = run_bg(
        "npm run dev",
        cwd=str(BACKEND_DIR),
        env_extra={"PORT": str(BACKEND_PORT)},
    )
    started_processes.append(backend_proc)
    log_step_ok(f"后端启动中 (PID {backend_proc.pid})")

    log_info("等待后端就绪...")
    if wait_for_url(
        f"http://127.0.0.1:{BACKEND_PORT}/api/health",
        timeout=SERVICE_START_TIMEOUT_SECONDS,
    ):
        log_ok("后端已就绪")
    else:
        log_err("后端启动超时，已取消分享模式")
        finish_cleanup()
        sys.exit(1)

    # AI 服务（可选，未配置 API Key 时占位回复）
    log_step("启动 AI 服务 ")
    ai_service_dir = ROOT_DIR / "ai-service"
    ai_proc = None
    if ai_service_dir.exists() and (ai_service_dir / "main.py").exists():
        venv_python = ai_service_dir / ".venv" / "Scripts" / "python.exe"
        py_cmd = str(venv_python) if venv_python.exists() else "python"
        try:
            ai_proc = run_bg(f"{py_cmd} main.py", cwd=str(ai_service_dir))
            started_processes.append(ai_proc)
            log_step_ok(f"AI 服务启动中 (PID {ai_proc.pid})")
            if not port_in_use(8000):
                time.sleep(1)
        except Exception as e:
            log_warn(f"AI 服务启动失败: {e}")
    else:
        log_warn("AI 服务未找到，跳过（AiCompanion 仍可显示占位回复）")

    # 前端
    log_step("启动前端 ")
    frontend_proc = run_bg(
        "npm run dev",
        cwd=str(FRONTEND_DIR),
        env_extra={"PORT": str(FRONTEND_PORT)},
    )
    started_processes.append(frontend_proc)
    log_step_ok(f"前端启动中 (PID {frontend_proc.pid})")

    log_info("等待前端就绪...")
    if not wait_for_url(
        f"http://127.0.0.1:{FRONTEND_PORT}",
        timeout=SERVICE_START_TIMEOUT_SECONDS,
    ):
        log_err(f"前端启动超时，请检查端口 {FRONTEND_PORT} 或前端日志")
        log_info("提示：运行 python start.py stop 清理残留进程后重试")
        finish_cleanup()
        sys.exit(1)
    log_ok("前端已就绪")

    # Cloudflare Quick Tunnel
    log_step("Cloudflare 隧道 ")
    tunnel_url = None
    tunnel_proc = None

    # 与 Node 隧道启动器保持一致：显式路径 > 用户目录 > 项目目录 > PATH。
    cloudflared_cmd = resolve_cloudflared_command()
    if cloudflared_cmd:
        try:
            tunnel_proc = subprocess.Popen(
                [
                    cloudflared_cmd,
                    "tunnel",
                    "--url", f"http://127.0.0.1:{FRONTEND_PORT}",
                    "--protocol", TUNNEL_PROTOCOL,
                    "--no-autoupdate",
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding="utf-8",
                errors="replace",
            )
            started_processes.append(tunnel_proc)
        except OSError as error:
            log_err(f"cloudflared 启动失败: {error}")
            finish_cleanup()
            sys.exit(1)

        # 地址由 API 分配后，还要等连接器注册到边缘网络，才能对外提供服务。
        import threading
        tunnel_ready = threading.Event()
        tunnel_connected = threading.Event()

        def _read_tunnel():
            nonlocal tunnel_url
            quick_tunnel_created = False
            for line in tunnel_proc.stdout:
                output_line = line.rstrip()
                print(f"  {C_GRAY}{output_line}{C_RESET}", flush=True)
                if QUICK_TUNNEL_CREATED_MARKER in output_line:
                    quick_tunnel_created = True
                if quick_tunnel_created and tunnel_url is None:
                    match = re.search(
                        r"https://[a-zA-Z0-9.-]+\.trycloudflare\.com",
                        output_line,
                    )
                    if match:
                        tunnel_url = match.group(0)
                if TUNNEL_CONNECTED_MARKER in output_line:
                    tunnel_connected.set()
                if tunnel_url and tunnel_connected.is_set():
                    tunnel_ready.set()

        threading.Thread(target=_read_tunnel, daemon=True).start()

        log_info(
            f"隧道协议: {TUNNEL_PROTOCOL}; 就绪超时: {TUNNEL_READY_TIMEOUT_SECONDS}s"
        )
        tunnel_deadline = time.monotonic() + TUNNEL_READY_TIMEOUT_SECONDS
        while (
            not tunnel_ready.is_set()
            and tunnel_proc.poll() is None
            and time.monotonic() < tunnel_deadline
        ):
            tunnel_ready.wait(timeout=0.25)

        tunnel_exit_code = tunnel_proc.poll()
        if tunnel_url and tunnel_connected.is_set() and tunnel_exit_code is None:
            log_step_ok("隧道已建立")
        else:
            if tunnel_exit_code is None:
                log_err("隧道连接 Cloudflare 边缘超时，请检查网络或代理后重试")
            else:
                log_err(f"cloudflared 提前退出 (退出码 {tunnel_exit_code})")
            finish_cleanup()
            sys.exit(tunnel_exit_code or 1)
    else:
        log_err("cloudflared 未安装，无法启动分享模式")
        log_info("可设置 CLOUDFLARED_PATH，或运行: winget install Cloudflare.cloudflared")
        finish_cleanup()
        sys.exit(1)

    # 显示状态
    print(f"""
  {C_GREEN}══════════════════════════════════════════════
    服务已启动 - 分享模式
  ════════════════════════════════════════════{C_RESET}

  {C_CYAN}  本地前端: http://localhost:{FRONTEND_PORT}
  本地后端: http://localhost:{BACKEND_PORT}""")
    if tunnel_url:
        print(f"""
  {C_YELLOW}  公网链接 (发给朋友):
  {C_WHITE}  {tunnel_url}{C_RESET}""")
    print(f"""
  {C_GRAY}══════════════════════════════════════════════
    停止服务: 当前窗口按 Ctrl+C
  ════════════════════════════════════════════{C_RESET}
""")

    # 监控所有进程；分享链任一必需进程退出都停止整组服务。
    exit_code = 0
    try:
        while True:
            if backend_proc.poll() is not None:
                log_err(f"后端进程已退出 (退出码 {backend_proc.returncode})")
                exit_code = backend_proc.returncode or 1
                break
            if frontend_proc.poll() is not None:
                log_err(f"前端进程已退出 (退出码 {frontend_proc.returncode})")
                exit_code = frontend_proc.returncode or 1
                break
            if tunnel_proc.poll() is not None:
                log_err(f"Cloudflare 隧道已退出 (退出码 {tunnel_proc.returncode})")
                exit_code = tunnel_proc.returncode or 1
                break
            if ai_proc and ai_proc.poll() is not None:
                log_warn(f"AI 服务已退出 (退出码 {ai_proc.returncode})")
                ai_proc = None
            time.sleep(2)
    except KeyboardInterrupt:
        log_info("\n收到停止信号，正在停止服务...")
    finally:
        finish_cleanup()
        log_ok("服务已停止")
    if exit_code:
        sys.exit(exit_code)


# ── 启动诊断 ───────────────────────────────────────────────
def start_doctor():
    """只读检查本地依赖、端口和 Cloudflare 网络，不启动任何服务。"""
    log_title("启动诊断（只读）")
    required_failures = 0
    warnings = 0

    def report(name, ok, detail, required=False):
        nonlocal required_failures, warnings
        if ok:
            log_ok(f"{name}: {detail}")
        else:
            log_warn(f"{name}: {detail}")
            if required:
                required_failures += 1
            else:
                warnings += 1

    for command_name in ("node", "npm"):
        command_path = shutil.which(command_name)
        report(
            command_name,
            command_path is not None,
            command_path or "未安装或不在 PATH",
            required=True,
        )

    postgres_ready = port_in_use(5432)
    report(
        "PostgreSQL",
        postgres_ready,
        "端口 5432 已监听" if postgres_ready else "端口 5432 未监听",
    )
    backend_env_exists = (BACKEND_DIR / ".env").is_file()
    report(
        "后端环境文件",
        backend_env_exists,
        "backend/.env 已存在" if backend_env_exists else "缺少 backend/.env",
    )
    missing_modules = [
        name
        for directory, name in (
            (ROOT_DIR, "root"),
            (FRONTEND_DIR, "frontend"),
            (BACKEND_DIR, "backend"),
        )
        if not (directory / "node_modules").is_dir()
    ]
    report(
        "Node 依赖",
        not missing_modules,
        "已安装" if not missing_modules else "缺少: " + ", ".join(missing_modules),
    )

    cloudflared_command = resolve_cloudflared_command()
    if cloudflared_command:
        try:
            version_result = run(
                [cloudflared_command, "--version"],
                capture=True,
            )
            version_output = (version_result.stdout or version_result.stderr).strip()
            report(
                "cloudflared",
                version_result.returncode == 0,
                version_output or cloudflared_command,
            )
        except (OSError, subprocess.SubprocessError) as error:
            report("cloudflared", False, str(error))
    else:
        report("cloudflared", False, "未安装，分享模式不可用")

    for name, port in (("前端端口", FRONTEND_PORT), ("后端端口", BACKEND_PORT)):
        available = port_available(port)
        detail = f"{port} 可用" if available else f"{port} 已占用，启动时会自动避让"
        report(name, available, detail)

    api_ok, api_detail = probe_http_endpoint("https://api.trycloudflare.com")
    report("Cloudflare Quick Tunnel API", api_ok, api_detail)
    if not api_ok:
        log_info("使用代理时，请确认 Python/cloudflared 可通过 TUN，或配置 HTTPS_PROXY")
    edge_ok, edge_detail = probe_tcp_endpoint("region1.v2.argotunnel.com", 7844)
    report("Cloudflare Tunnel Edge", edge_ok, edge_detail)
    requested_protocol = os.environ.get("CLOUDFLARED_PROTOCOL")
    if requested_protocol and requested_protocol.strip().lower() not in SUPPORTED_TUNNEL_PROTOCOLS:
        report(
            "CLOUDFLARED_PROTOCOL",
            False,
            f"{requested_protocol!r} 无效，已安全回退到 {TUNNEL_PROTOCOL}",
        )
    log_info(
        f"隧道协议: {TUNNEL_PROTOCOL}; 服务超时: {SERVICE_START_TIMEOUT_SECONDS}s; "
        f"隧道超时: {TUNNEL_READY_TIMEOUT_SECONDS}s"
    )

    if required_failures:
        log_err(f"诊断完成：{required_failures} 个必需依赖不可用")
        sys.exit(1)
    if warnings:
        log_warn(f"诊断完成：本地开发可启动，但有 {warnings} 项需要留意")
    else:
        log_ok("诊断完成：本地开发和分享条件均可用")


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

# ── 交互式菜单 ─────────────────────────────────────────────
def show_menu():
    """无参数启动时显示交互式菜单"""
    show_banner()

    # 检测 cloudflared 是否可用
    has_cf = resolve_cloudflared_command() is not None

    tunnel_label = "开发 + 隧道（⚠ cloudflared 未安装）" if not has_cf else "开发 + Cloudflare 隧道（生成公网链接发给朋友）"

    options = [
        ("dev",     "开发模式（前后端热更新，SQL 日志全开）"),
        ("share",   tunnel_label),
        ("preview", "预览模式（先构建再启动，模拟生产）"),
        ("init",    "初始化（安装依赖 + 数据库迁移 + 种子数据）"),
        ("stop",    "停止所有运行中的服务"),
        ("doctor",  "启动诊断（只读，不启动服务）"),
    ]

    print(f"  {C_CYAN}请选择启动模式:{C_RESET}")
    print()
    for i, (_, desc) in enumerate(options, 1):
        print(f"  {C_BOLD}[{i}]{C_RESET} {desc}")
    print()

    while True:
        try:
            choice = input(f"  {C_GREEN}> 输入数字 1-{len(options)}:{C_RESET} ").strip()
            if choice == "q" or choice == "Q":
                print(f"  {C_GRAY}已取消{C_RESET}")
                sys.exit(0)
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                return options[idx][0]
        except (ValueError, IndexError):
            pass
        print(f"  {C_YELLOW}  请输入 1-{len(options)} 或 q 退出{C_RESET}")


# ── 主入口 ─────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="INK.SPIRIT Blog 一键启动脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python start.py              # 交互式菜单
  python start.py dev          # 开发模式（前后端热更新）
  python start.py share        # 开发模式 + Cloudflare 隧道
  python start.py preview      # 预览模式（先构建再启动）
  python start.py stop         # 停止所有服务
  python start.py init         # 仅初始化环境（安装依赖 + 数据库）
  python start.py doctor       # 只读检查依赖、端口和隧道网络

可选环境变量:
  CLOUDFLARED_PROTOCOL=auto|quic|http2
  STARTUP_TIMEOUT_SECONDS=30
  CLOUDFLARED_READY_TIMEOUT_SECONDS=30
"""
    )
    parser.add_argument(
        "mode", nargs="?", default=None,
        choices=["dev", "preview", "docker", "stop", "init", "share", "doctor"],
        help="启动模式 (不传则显示交互式菜单)"
    )
    args = parser.parse_args()

    if args.mode is None:
        args.mode = show_menu()

    show_banner()

    actions = {
        "dev":     start_dev,
        "preview": start_preview,
        "docker":  start_docker,
        "stop":    stop_services,
        "init":    start_init,
        "share":   start_share,
        "doctor":  start_doctor,
    }
    actions[args.mode]()

if __name__ == "__main__":
    main()
