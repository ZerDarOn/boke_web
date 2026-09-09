/**
 * INK.SPIRIT 启动器
 * 支持三种模式：开发 / 预览 / 生产
 * 自动检测端口占用并提供解决方案
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
let portManager;

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const TUNNEL_DIR = path.join(ROOT_DIR, 'tunnel');

// Invoke npm through the Windows command processor explicitly. This keeps
// argument boundaries visible to Node and avoids shell:true's unsafe string
// concatenation/deprecation warning.
const spawnNpm = (args, options) => {
  if (process.platform === 'win32') {
    return spawn(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'npm.cmd', ...args],
      options
    );
  }
  return spawn('npm', args, options);
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`),
};

// 显示 Banner
const showBanner = () => {
  console.log('');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════╗`);
  console.log(`║${colors.reset}                                                        ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ███╗   ██╗██╗██████╗ ███████╗              ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ████╗  ██║██║██╔══██╗██╔════╝              ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ██╔██╗ ██║██║██║  ██║█████╗                ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ██║╚██╗██║██║██║  ██║██╔══╝                ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ██║ ╚████║██║██████╔╝███████╗              ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.bright}${colors.magenta}         ╚═╝  ╚═══╝╚═╝╚═════╝ ╚══════╝              ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.reset}                                                        ${colors.cyan}║`);
  console.log(`║${colors.bright}           INK.SPIRIT 启动器 v2.0                       ${colors.reset}    ${colors.cyan}║`);
  console.log(`║${colors.reset}                                                        ${colors.cyan}║`);
  console.log(`╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
};

// 显示帮助
const showHelp = () => {
  showBanner();
  console.log('用法: node start.js <模式> [选项]');
  console.log('');
  console.log('模式:');
  console.log('  dev      开发模式（默认）- 热更新，方便调试');
  console.log('  preview  预览模式 - 构建后预览，速度快');
  console.log('  build    构建生产版本');
  console.log('  tunnel   启动隧道（配合 dev/preview 使用）');
  console.log('  clean    检查启动状态（不会终止外部进程）');
  console.log('');
  console.log('选项:');
  console.log('  --tunnel 启动时同时开启隧道');
  console.log('  --help   显示帮助信息');
  console.log('');
  console.log('隧道环境变量:');
  console.log('  CLOUDFLARED_PROTOCOL=auto|quic|http2（默认 http2）');
  console.log('');
  console.log('示例:');
  console.log('  node start.js dev              # 开发模式');
  console.log('  node start.js preview          # 预览模式');
  console.log('  node start.js dev --tunnel     # 开发模式 + 隧道');
  console.log('  node start.js clean            # 检查启动状态');
  console.log('');
};

// 等待服务启动
const waitForService = async (url, maxAttempts = 30) => {
  const http = require('http');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
};

// 更新后端端口配置
const updateBackendPort = async (port) => {
  const envPath = path.join(BACKEND_DIR, '.env');
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf-8');
    content = content.replace(/PORT=\d+/, `PORT=${port}`);
    fs.writeFileSync(envPath, content);
    log.info(`后端端口已更新为 ${port}`);
  }
};

// 更新前端端口配置
const updateFrontendPort = async (port) => {
  const viteConfigPath = path.join(FRONTEND_DIR, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    let content = fs.readFileSync(viteConfigPath, 'utf-8');
    content = content.replace(/port:\s*\d+/, `port: ${port}`);
    fs.writeFileSync(viteConfigPath, content);
    log.info(`前端端口已更新为 ${port}`);
  }
};

// 启动后端
const startBackend = async (port) => {
  log.info('启动后端服务...');
  
  // 更新端口配置
  await updateBackendPort(port);
  
  return spawnNpm(['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1', PORT: String(port) }
  });
};

// 构建前端
const buildFrontend = async () => {
  log.title('📦 构建前端...');

  const distPath = path.join(FRONTEND_DIR, 'dist');
  if (fs.existsSync(distPath)) {
    log.info('清理旧的构建文件...');
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  log.info('正在构建（可能需要 1-2 分钟）...');

  return new Promise((resolve, reject) => {
    const proc = spawnNpm(['run', 'build'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log.success('构建完成！');
        resolve(code);
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
};

// 构建后端
const buildBackend = async () => {
  log.title('📦 构建后端...');
  log.info('正在编译 TypeScript...');

  return new Promise((resolve, reject) => {
    const proc = spawnNpm(['run', 'build'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log.success('后端构建完成！');
        resolve(code);
      } else {
        reject(new Error(`Backend build failed with code ${code}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
};

// 启动前端（开发模式）
const startFrontendDev = async (port) => {
  log.info('启动前端开发服务器...');
  
  return spawnNpm(['run', 'dev', '--', '--port', String(port), '--host'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1', PORT: String(port) }
  });
};

// 启动前端（预览模式）
const startFrontendPreview = async (port) => {
  log.info('启动前端预览服务器...');
  
  const distPath = path.join(FRONTEND_DIR, 'dist');
  if (!fs.existsSync(distPath)) {
    log.warn('未找到构建文件，正在构建...');
    await buildFrontend();
  }
  
  const isWindows = process.platform === 'win32';
  
  // Windows 上使用 npm run preview 更稳定
  if (isWindows) {
    return spawnNpm(['run', 'preview', '--', '--port', String(port), '--host'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
  }
  
  // Linux/Mac 使用 npx
  return spawn('npx', ['vite', 'preview', '--port', String(port), '--host'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
};

// 启动隧道
const startTunnel = (port) => {
  log.info('启动 Cloudflare Tunnel...');

  const args = port === undefined ? ['index.js'] : ['index.js', String(port)];
  return spawn(process.execPath, args, {
    cwd: TUNNEL_DIR,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
};

const terminatingProcesses = new WeakSet();

const stopChildProcess = (
  child,
  {
    platform = process.platform,
    taskkillProcess = spawnSync,
  } = {},
) => {
  if (!child || typeof child !== 'object' || terminatingProcesses.has(child)) {
    return;
  }
  if (
    (child.exitCode !== undefined && child.exitCode !== null)
    || (child.signalCode !== undefined && child.signalCode !== null)
  ) {
    return;
  }
  terminatingProcesses.add(child);

  if (platform === 'win32' && Number.isInteger(child.pid) && child.pid > 0) {
    const result = taskkillProcess(
      'taskkill.exe',
      ['/PID', String(child.pid), '/T', '/F'],
      { stdio: 'ignore', windowsHide: true },
    );
    if (!result.error && result.status === 0) {
      return;
    }
  }

  try {
    child.kill('SIGTERM');
  } catch {
    // The child may have exited between the state check and termination request.
  }
};

const stopChildProcesses = (processes, excludedProcess, options) => {
  for (const child of processes) {
    if (!child || child === excludedProcess) {
      continue;
    }
    stopChildProcess(child, options);
  }
};

const monitorTunnelProcess = (tunnelProc, processes) => {
  let failureHandled = false;
  const fail = (message, exitCode = 1) => {
    if (failureHandled) {
      return;
    }
    failureHandled = true;
    log.error(message);
    stopChildProcesses(processes, tunnelProc);
    setTimeout(() => process.exit(exitCode), 100);
  };

  tunnelProc.once('error', (error) => {
    fail('隧道进程启动失败: ' + error.message);
  });
  tunnelProc.once('close', (code, signal) => {
    const detail = signal ? 'signal ' + signal : 'exit ' + code;
    const exitCode = Number.isInteger(code) && code > 0 ? code : 1;
    fail('隧道进程已退出 (' + detail + ')，正在停止本地服务。', exitCode);
  });
};

const setupLauncherExitHandler = (
  processes,
  {
    signalSource = process,
    exitProcess = (code) => process.exit(code),
    stopOptions,
  } = {},
) => {
  let shuttingDown = false;
  const stopChildren = () => stopChildProcesses(processes, undefined, stopOptions);
  const shutdown = () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    stopChildren();
    exitProcess(0);
  };

  signalSource.once('SIGINT', shutdown);
  signalSource.once('SIGTERM', shutdown);
  signalSource.once('exit', stopChildren);
};

// 显示运行状态
const showStatus = (mode, ports, withTunnel) => {
  console.log('');
  console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}  ✓ 服务已启动${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}`);
  console.log('');
  console.log(`  模式: ${colors.bright}${colors.yellow}${mode === 'dev' ? '开发模式' : '预览模式'}${colors.reset}`);
  console.log('');
  console.log(`  前端: ${colors.blue}http://localhost:${ports.frontend}${colors.reset}`);
  console.log(`  后端: ${colors.blue}http://localhost:${ports.backend}${colors.reset}`);
  if (withTunnel) {
    console.log('');
    console.log(`  隧道: ${colors.magenta}查看终端输出获取公网地址${colors.reset}`);
  }
  console.log('');
  console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}`);
  console.log(`  按 Ctrl+C 停止所有服务`);
  console.log(`${colors.cyan}════════════════════════════════════════════${colors.reset}`);
  console.log('');
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const mode = args.find(a => !a.startsWith('--')) || 'dev';
  const withTunnel = args.includes('--tunnel');
  const showHelpOnly = args.includes('--help');
  
  if (showHelpOnly || mode === 'help') {
    showHelp();
    process.exit(0);
  }

  // 生产构建只调用 Vite，不应因开发启动器的可选端口管理模块而失败。
  if (mode !== 'build') {
    try {
      portManager = require('./portManager');
    } catch {
      log.error('缺少 portManager.js，无法启动开发、预览或清理模式。可直接使用 npm run build:frontend 完成构建。');
      process.exit(1);
    }
  }
  
  showBanner();
  
  // 清理模式
  if (mode === 'clean') {
    log.title('🧹 检查启动状态');
    await portManager.cleanupZombieProcesses();
    log.info('启动器不会终止非本次启动的进程；端口冲突会在启动时自动避让。');
    process.exit(0);
  }
  
  // 定义模式描述
  const modeDescriptions = {
    dev: '开发模式 - 热更新，方便调试',
    preview: '预览模式 - 构建后预览，速度快',
    build: '构建生产版本',
    tunnel: '仅启动隧道',
  };
  
  log.title(`🚀 ${modeDescriptions[mode] || mode}`);
  
  // 开发/预览模式才需要端口管理；构建模式不依赖该可选模块。
  if (portManager) {
    await portManager.cleanupZombieProcesses();
  }
  
  const processes = [];
  setupLauncherExitHandler(processes);
  
  // 处理不同模式
  switch (mode) {
    case 'build':
      await buildBackend();
      await buildFrontend();
      process.exit(0);
      break;
      
    case 'tunnel':
      const tunnelProc = startTunnel();
      processes.push(tunnelProc);
      tunnelProc.on('error', (error) => {
        log.error('隧道进程启动失败: ' + error.message);
        process.exit(1);
      });
      tunnelProc.on('close', (code) => process.exit(code ?? 1));
      break;
      
    case 'preview':
    case 'dev':
    default:
      // 准备端口（自动检测和处理冲突）
      const ports = await portManager.preparePorts();

      if (mode === 'preview') {
        // 预览模式：先检查是否需要构建
        const distPath = path.join(FRONTEND_DIR, 'dist');
        if (!fs.existsSync(distPath)) {
          log.warn('未找到构建文件，需要先构建...');
          await buildFrontend();
        }

        // 启动后端
        log.info('启动后端服务...');
        processes.push(await startBackend(ports.backendPort));
        log.info('等待后端就绪...');
        const backendReady = await waitForService(`http://localhost:${ports.backendPort}/api/health`);
        if (!backendReady) {
          log.error('后端服务启动超时');
          process.exit(1);
        }
        log.success('后端服务已就绪');

        // 启动前端
        log.info('启动前端服务...');
        processes.push(await startFrontendPreview(ports.frontendPort));
        log.info('等待前端就绪...');
        const frontendReady = await waitForService(`http://localhost:${ports.frontendPort}`);
        if (!frontendReady) {
          log.error('前端服务启动超时');
          process.exit(1);
        }
        log.success('前端服务已就绪');
      } else {
        // 开发模式
        // 启动后端
        log.info('启动后端服务...');
        processes.push(await startBackend(ports.backendPort));
        log.info('等待后端就绪...');
        const backendReady = await waitForService(`http://localhost:${ports.backendPort}/api/health`);
        if (!backendReady) {
          log.error('后端服务启动超时');
          process.exit(1);
        }
        log.success('后端服务已就绪');

        // 启动前端
        log.info('启动前端服务...');
        processes.push(await startFrontendDev(ports.frontendPort));
        log.info('等待前端就绪...');
        const frontendReady = await waitForService(`http://localhost:${ports.frontendPort}`);
        if (!frontendReady) {
          log.error('前端服务启动超时');
          process.exit(1);
        }
        log.success('前端服务已就绪');
      }

      if (withTunnel) {
        log.info('启动隧道服务...');
        await new Promise(r => setTimeout(r, 500));
        const tunnelProc = startTunnel(ports.frontendPort);
        processes.push(tunnelProc);
        monitorTunnelProcess(tunnelProc, processes);
      }

      showStatus(mode, {
        frontend: ports.frontendPort,
        backend: ports.backendPort
      }, withTunnel);
      break;
  }
};

if (require.main === module) {
  main().catch(err => {
    log.error(err.message);
    process.exit(1);
  });
}

module.exports = {
  monitorTunnelProcess,
  setupLauncherExitHandler,
  stopChildProcess,
  stopChildProcesses,
};
