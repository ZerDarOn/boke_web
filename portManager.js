/**
 * 端口管理模块
 * 检测端口占用、提供交互式解决方案
 */

const { exec, spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

/**
 * 检测端口是否被占用
 */
const checkPort = (port) => {
  return new Promise((resolve) => {
    const cmd = isWindows
      ? `netstat -ano | findstr ":${port} "`
      : `lsof -i :${port}`;
    
    exec(cmd, (err, stdout) => {
      if (!stdout || stdout.trim() === '') {
        resolve({ inUse: false, processes: [], timeWaitOnly: false });
        return;
      }
      
      // 检查状态
      const hasTimeWait = stdout.includes('TIME_WAIT') || stdout.includes('CLOSE_WAIT') || stdout.includes('FIN_WAIT');
      const hasListening = stdout.includes('LISTENING');
      const hasEstablished = stdout.includes('ESTABLISHED');
      
      // 解析进程信息（会过滤掉 TIME_WAIT）
      const processes = parsePortInfo(stdout, port);
      
      // 如果只有 TIME_WAIT 等等待状态，不算真正被占用
      const timeWaitOnly = hasTimeWait && !hasListening && !hasEstablished && processes.length === 0;
      
      resolve({ 
        inUse: processes.length > 0, 
        processes,
        timeWaitOnly,
        rawOutput: stdout
      });
    });
  });
};

/**
 * 解析端口占用信息
 */
const parsePortInfo = (output, port) => {
  const processes = [];
  const lines = output.split('\n').filter(line => line.trim());
  
  if (isWindows) {
    // Windows 格式
    // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
    for (const line of lines) {
      if (line.includes(`:${port}`)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        const state = parts.find(p => ['LISTENING', 'ESTABLISHED', 'TIME_WAIT', 'CLOSE_WAIT', 'FIN_WAIT_2'].includes(p)) || 'UNKNOWN';
        
        // 跳过 TIME_WAIT 和无效 PID (PID 0 或非数字)
        if (state === 'TIME_WAIT' || pid === '0' || !pid || isNaN(pid)) {
          continue;
        }
        
        if (!processes.find(p => p.pid === pid)) {
          processes.push({
            pid,
            port,
            state,
            name: 'Unknown',
          });
        }
      }
    }
  } else {
    // Linux/Mac 格式
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[1];
      const name = parts[0];
      // 跳过 TIME_WAIT 状态
      if (pid && !isNaN(pid) && pid !== '0') {
        processes.push({ pid, port, name });
      }
    }
  }
  
  return processes;
};

/**
 * 获取进程名称（Windows）
 */
const getProcessName = (pid) => {
  return new Promise((resolve) => {
    if (!isWindows) {
      resolve('Unknown');
      return;
    }
    
    exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (err, stdout) => {
      if (err) {
        resolve('Unknown');
        return;
      }
      
      // 解析 CSV 格式
      const match = stdout.match(/"([^"]+)"/);
      resolve(match ? match[1] : 'Unknown');
    });
  });
};

/**
 * 杀掉指定 PID 的进程
 */
const killProcess = (pid) => {
  return new Promise((resolve) => {
    const cmd = isWindows
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    exec(cmd, (err, stdout, stderr) => {
      resolve(!err);
    });
  });
};

/**
 * 创建 readline 接口
 */
const createRL = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

/**
 * 提示用户选择
 */
const prompt = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

/**
 * 查找可用端口
 */
const findAvailablePort = async (startPort, maxAttempts = 10) => {
  for (let port = startPort + 1; port <= startPort + maxAttempts; port++) {
    const { inUse } = await checkPort(port);
    if (!inUse) {
      return port;
    }
  }
  return null;
};

/**
 * 处理端口占用
 * @param {number} port - 端口号
 * @param {string} serviceName - 服务名称（frontend/backend）
 * @returns {Promise<number|null>} - 返回可用端口或 null（取消）
 */
const handlePortConflict = async (port, serviceName) => {
  const { inUse, processes, timeWaitOnly } = await checkPort(port);
  
  if (!inUse && !timeWaitOnly) {
    return port;
  }
  
  // 如果只有 TIME_WAIT 状态，给提示
  if (timeWaitOnly) {
    console.log('');
    console.log(`${colors.yellow}══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}  端口 ${port} 处于 TIME_WAIT 状态${colors.reset}`);
    console.log(`${colors.yellow}══════════════════════════════════════════════════${colors.reset}`);
    console.log('');
    log.info('这是 TCP 协议的正常行为，端口正在等待之前的连接完全关闭');
    log.info('通常需要等待 1-4 分钟才能再次使用');
    console.log('');
    console.log('请选择处理方式：');
    console.log('');
    console.log(`  [1] 强制使用端口 ${port}（推荐，通常可以成功）`);
    console.log('  [2] 自动查找其他可用端口');
    console.log('  [3] 手动输入新端口');
    console.log('  [0] 取消启动');
    console.log('');
    
    const rl = createRL();
    const choice = await prompt(rl, '请输入选项 [0-3]: ');
    rl.close();
    
    switch (choice) {
      case '1':
        log.info(`尝试强制使用端口 ${port}...`);
        // 等待几秒让 TIME_WAIT 释放
        await new Promise(r => setTimeout(r, 2000));
        return port;
      case '2':
        rl.close();
        log.info(`正在查找可用端口...`);
        const newPort = await findAvailablePort(port);
        if (newPort) {
          log.success(`找到可用端口: ${newPort}`);
          return newPort;
        } else {
          log.error('未找到可用端口');
          return null;
        }
      case '3':
        const customPort = await prompt(rl, '请输入新端口号: ');
        rl.close();
        const portNum = parseInt(customPort);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          log.error('无效的端口号');
          return null;
        }
        return portNum;
      case '0':
      default:
        rl.close();
        log.info('已取消启动');
        return null;
    }
  }
  
  console.log('');
  console.log(`${colors.yellow}══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}  端口 ${port} 被占用${colors.reset}`);
  console.log(`${colors.yellow}══════════════════════════════════════════════════${colors.reset}`);
  console.log('');
  
  // 显示占用进程信息
  log.info(`占用端口 ${port} 的进程：`);
  for (const proc of processes) {
    const name = await getProcessName(proc.pid);
    console.log(`    PID: ${colors.cyan}${proc.pid}${colors.reset}  进程: ${colors.cyan}${name}${colors.reset}  状态: ${proc.state}`);
  }
  console.log('');
  
  // 提供选项
  console.log('请选择处理方式：');
  console.log('');
  console.log(`  [1] 终止占用进程并使用端口 ${port}`);
  console.log('  [2] 自动查找其他可用端口');
  console.log('  [3] 手动输入新端口');
  console.log('  [0] 取消启动');
  console.log('');
  
  const rl = createRL();
  const choice = await prompt(rl, '请输入选项 [0-3]: ');
  
  switch (choice) {
    case '1':
      // 杀掉占用进程
      log.info('正在终止占用进程...');
      let allKilled = true;
      for (const proc of processes) {
        const killed = await killProcess(proc.pid);
        if (killed) {
          log.success(`进程 ${proc.pid} 已终止`);
        } else {
          log.error(`无法终止进程 ${proc.pid}`);
          allKilled = false;
        }
      }
      rl.close();
      
      if (allKilled) {
        // 等待端口释放
        await new Promise(r => setTimeout(r, 1000));
        const { inUse: stillInUse } = await checkPort(port);
        if (!stillInUse) {
          log.success(`端口 ${port} 已释放`);
          return port;
        } else {
          log.error('端口仍被占用，请重试');
          return null;
        }
      }
      return null;
      
    case '2':
      // 自动查找可用端口
      rl.close();
      log.info(`正在查找可用端口...`);
      const newPort = await findAvailablePort(port);
      if (newPort) {
        log.success(`找到可用端口: ${newPort}`);
        return newPort;
      } else {
        log.error('未找到可用端口');
        return null;
      }
      
    case '3':
      // 手动输入端口
      const customPort = await prompt(rl, '请输入新端口号: ');
      rl.close();
      
      const portNum = parseInt(customPort);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        log.error('无效的端口号');
        return null;
      }
      
      const { inUse: customInUse } = await checkPort(portNum);
      if (customInUse) {
        log.error(`端口 ${portNum} 也被占用`);
        return handlePortConflict(portNum, serviceName);
      }
      
      return portNum;
      
    case '0':
    default:
      rl.close();
      log.info('已取消启动');
      return null;
  }
};

/**
 * 检查并准备端口
 * 同时检查前端和后端端口
 */
const preparePorts = async () => {
  const configPath = path.join(__dirname, '.port-config.json');
  
  // 读取默认端口
  let frontendPort = 3000;
  let backendPort = 3001;
  
  // 检查是否有保存的端口配置
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      frontendPort = config.frontendPort || 3000;
      backendPort = config.backendPort || 3001;
    } catch (e) {}
  }
  
  // 检查前端端口
  console.log(`\n${colors.cyan}检查前端端口 ${frontendPort}...${colors.reset}`);
  const finalFrontendPort = await handlePortConflict(frontendPort, 'frontend');
  if (!finalFrontendPort) {
    process.exit(1);
  }
  
  // 检查后端端口
  console.log(`\n${colors.cyan}检查后端端口 ${backendPort}...${colors.reset}`);
  const finalBackendPort = await handlePortConflict(backendPort, 'backend');
  if (!finalBackendPort) {
    process.exit(1);
  }
  
  // 保存端口配置
  if (finalFrontendPort !== frontendPort || finalBackendPort !== backendPort) {
    fs.writeFileSync(configPath, JSON.stringify({
      frontendPort: finalFrontendPort,
      backendPort: finalBackendPort,
    }, null, 2));
    log.info('端口配置已保存');
  }
  
  return {
    frontendPort: finalFrontendPort,
    backendPort: finalBackendPort,
  };
};

/**
 * 清理僵尸进程
 * 检查是否有残留的 node 进程
 */
const cleanupZombieProcesses = async () => {
  log.info('检查残留进程...');
  
  const portsToCheck = [3000, 3001, 3002];
  const zombies = [];
  
  for (const port of portsToCheck) {
    const { inUse, processes } = await checkPort(port);
    if (inUse) {
      for (const proc of processes) {
        const name = await getProcessName(proc.pid);
        // 检查是否是 node 相关进程
        if (name.toLowerCase().includes('node') || 
            name.toLowerCase().includes('tsx') ||
            name.toLowerCase().includes('vite')) {
          zombies.push({ ...proc, name });
        }
      }
    }
  }
  
  if (zombies.length === 0) {
    log.success('没有残留进程');
    return true;
  }
  
  log.warn(`发现 ${zombies.length} 个残留进程：`);
  for (const z of zombies) {
    console.log(`    PID: ${colors.cyan}${z.pid}${colors.reset}  进程: ${colors.cyan}${z.name}${colors.reset}  端口: ${z.port}`);
  }
  
  const rl = createRL();
  const answer = await prompt(rl, '\n是否清理这些残留进程？[Y/n]: ');
  rl.close();
  
  if (answer.toLowerCase() === 'n') {
    log.info('跳过清理');
    return false;
  }
  
  log.info('正在清理残留进程...');
  for (const z of zombies) {
    const killed = await killProcess(z.pid);
    if (killed) {
      log.success(`已终止 PID ${z.pid}`);
    } else {
      log.error(`无法终止 PID ${z.pid}`);
    }
  }
  
  await new Promise(r => setTimeout(r, 500));
  return true;
};

/**
 * 程序退出时的清理处理
 */
const setupExitHandler = (processes = []) => {
  const cleanup = () => {
    console.log('\n');
    log.info('正在清理进程...');
    
    processes.forEach(p => {
      try {
        if (p && !p.killed) {
          p.kill('SIGTERM');
        }
      } catch (e) {}
    });
    
    log.success('清理完成');
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    processes.forEach(p => {
      try {
        if (p && !p.killed) p.kill();
      } catch (e) {}
    });
  });
};

module.exports = {
  checkPort,
  handlePortConflict,
  preparePorts,
  cleanupZombieProcesses,
  setupExitHandler,
  killProcess,
  findAvailablePort,
};
