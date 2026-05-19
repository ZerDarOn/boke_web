/**
 * INK.SPIRIT 启动器
 * 支持三种模式：开发 / 预览 / 生产
 * 自动检测端口占用并提供解决方案
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const portManager = require('./portManager');

const MODE = process.argv[2] || 'dev';
const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const TUNNEL_DIR = path.join(ROOT_DIR, 'tunnel');

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
  console.log('  clean    清理残留进程');
  console.log('');
  console.log('选项:');
  console.log('  --tunnel 启动时同时开启隧道');
  console.log('  --help   显示帮助信息');
  console.log('');
  console.log('示例:');
  console.log('  node start.js dev              # 开发模式');
  console.log('  node start.js preview          # 预览模式');
  console.log('  node start.js dev --tunnel     # 开发模式 + 隧道');
  console.log('  node start.js clean            # 清理残留进程');
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
  
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd' : 'npm';
  
  return spawn(cmd, ['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: isWindows,
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

  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd' : 'npm';

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, ['run', 'build'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: isWindows,
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

// 启动前端（开发模式）
const startFrontendDev = async (port) => {
  log.info('启动前端开发服务器...');
  
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd' : 'npm';
  
  return spawn(cmd, ['run', 'dev', '--', '--port', String(port), '--host'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: isWindows,
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
    return spawn('npm.cmd', ['run', 'preview', '--', '--port', String(port), '--host'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
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
const startTunnel = () => {
  log.info('启动 Cloudflare Tunnel...');

  return spawn(process.execPath, ['index.js'], {
    cwd: TUNNEL_DIR,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
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
  
  showBanner();
  
  // 清理模式
  if (mode === 'clean') {
    log.title('🧹 清理残留进程');
    await portManager.cleanupZombieProcesses();
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
  
  // 清理残留进程
  await portManager.cleanupZombieProcesses();
  
  const processes = [];
  
  // 处理不同模式
  switch (mode) {
    case 'build':
      await buildFrontend();
      process.exit(0);
      break;
      
    case 'tunnel':
      const tunnelProc = startTunnel();
      tunnelProc.on('close', () => process.exit(0));
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
        processes.push(startTunnel());
      }

      showStatus(mode, {
        frontend: ports.frontendPort,
        backend: ports.backendPort
      }, withTunnel);
      break;
  }
  
  // 设置退出处理
  portManager.setupExitHandler(processes);
};

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
