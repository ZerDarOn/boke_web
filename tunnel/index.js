/**
 * INK.SPIRIT Cloudflare Tunnel
 * 通过 cloudflared Quick Tunnel 暴露本地前端到公网。
 *
 * 用法:
 *   node tunnel/index.js [端口]      默认读取 .port-config.json，缺失时使用 5173
 *   node tunnel/index.js 5173
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const DEFAULT_FRONTEND_PORT = 5173;
const PREFLIGHT_TIMEOUT_MS = 2000;
const CHILD_SHUTDOWN_TIMEOUT_MS = 2000;
const DEFAULT_TUNNEL_PROTOCOL = 'http2';
const SUPPORTED_TUNNEL_PROTOCOLS = new Set(['auto', 'quic', 'http2']);
const QUICK_TUNNEL_CREATED_MARKER = 'Your quick Tunnel has been created!';
const TUNNEL_CONNECTED_MARKER = 'Registered tunnel connection';
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT_CONFIG_PATH = path.join(ROOT_DIR, '.port-config.json');

const parsePort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
};

const readConfiguredFrontendPort = (configPath = PORT_CONFIG_PATH) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return parsePort(config.frontendPort) || DEFAULT_FRONTEND_PORT;
  } catch {
    return DEFAULT_FRONTEND_PORT;
  }
};

const resolveTunnelPort = (argv = process.argv, configPath = PORT_CONFIG_PATH) => {
  if (argv[2] === undefined) {
    return readConfiguredFrontendPort(configPath);
  }

  const port = parsePort(argv[2]);
  if (port === null) {
    throw new Error('无效的前端端口: ' + argv[2]);
  }
  return port;
};

const resolveCloudflaredCommand = (env = process.env, platform = process.platform) => {
  if (env.CLOUDFLARED_PATH) {
    return env.CLOUDFLARED_PATH;
  }

  const executableName = platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  const candidates = [
    env.USERPROFILE ? path.join(env.USERPROFILE, executableName) : null,
    path.join(ROOT_DIR, executableName),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || 'cloudflared';
};

const resolveTunnelProtocol = (env = process.env) => {
  const requested = String(env.CLOUDFLARED_PROTOCOL || '')
    .trim()
    .toLowerCase();
  return SUPPORTED_TUNNEL_PROTOCOLS.has(requested)
    ? requested
    : DEFAULT_TUNNEL_PROTOCOL;
};

const isLocalTargetReady = (
  targetUrl,
  { timeoutMs = PREFLIGHT_TIMEOUT_MS, httpGet = http.get } = {},
) => new Promise((resolve) => {
  let request;
  let settled = false;

  const finish = (ready, destroyRequest = false) => {
    if (settled) {
      return;
    }
    settled = true;
    clearTimeout(deadline);
    if (destroyRequest && request) {
      request.destroy();
    }
    resolve(ready);
  };

  const deadline = setTimeout(() => finish(false, true), timeoutMs);

  try {
    request = httpGet(targetUrl, (response) => {
      response.resume();
      finish(Boolean(response.statusCode && response.statusCode < 500));
    });
    request.once('error', () => finish(false));
  } catch {
    finish(false);
  }
});

const printBanner = (consoleRef, targetUrl) => {
  consoleRef.log('');
  consoleRef.log('\x1b[35m╔═══════════════════════════════════════════╗\x1b[0m');
  consoleRef.log('\x1b[35m║  \x1b[36mINK.SPIRIT Cloudflare Tunnel\x1b[0m              \x1b[35m║\x1b[0m');
  consoleRef.log('\x1b[35m╚═══════════════════════════════════════════╝\x1b[0m');
  consoleRef.log('');
  consoleRef.log('  Target : ' + targetUrl);
  consoleRef.log('');
};

const printTunnelUrl = (consoleRef, tunnelUrl) => {
  consoleRef.log('');
  consoleRef.log('\x1b[32m╔═══════════════════════════════════════════╗\x1b[0m');
  consoleRef.log('\x1b[32m║  公网链接:\x1b[0m');
  consoleRef.log('\x1b[32m║  \x1b[1m\x1b[37m' + tunnelUrl + '\x1b[0m');
  consoleRef.log('\x1b[32m╚═══════════════════════════════════════════╝\x1b[0m');
  consoleRef.log('');
  consoleRef.log('  按 Ctrl+C 停止隧道');
  consoleRef.log('');
};

const startCloudflareTunnel = ({
  command,
  targetUrl,
  protocol = resolveTunnelProtocol(),
  spawnProcess = spawn,
  consoleRef = console,
  stdout = process.stdout,
  stderr = process.stderr,
}) => {
  const child = spawnProcess(command, [
    'tunnel',
    '--url', targetUrl,
    '--protocol', protocol,
    '--no-autoupdate',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let tunnelUrl = null;
  let tunnelConnected = false;
  let readyEmitted = false;
  let urlScanBuffer = '';
  const emitReadyIfPossible = () => {
    if (readyEmitted || !tunnelUrl || !tunnelConnected) {
      return;
    }
    readyEmitted = true;
    printTunnelUrl(consoleRef, tunnelUrl);
    child.emit('tunnel-ready', tunnelUrl);
  };
  const forwardOutput = (data, destination) => {
    const text = data.toString();
    destination.write(text);

    urlScanBuffer = (urlScanBuffer + text).slice(-8192);
    if (!tunnelUrl) {
      const markerIndex = urlScanBuffer.lastIndexOf(QUICK_TUNNEL_CREATED_MARKER);
      if (markerIndex >= 0) {
        const match = urlScanBuffer
          .slice(markerIndex)
          .match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
        if (match) {
          tunnelUrl = match[0];
        }
      }
    }
    if (!tunnelConnected && urlScanBuffer.includes(TUNNEL_CONNECTED_MARKER)) {
      tunnelConnected = true;
    }
    emitReadyIfPossible();
  };

  if (child.stdout) {
    child.stdout.on('data', (data) => forwardOutput(data, stdout));
  }
  if (child.stderr) {
    child.stderr.on('data', (data) => forwardOutput(data, stderr));
  }

  return child;
};

const signalExitCode = (signal) => {
  const signalNumber = signal ? os.constants.signals[signal] : undefined;
  return Number.isInteger(signalNumber) ? 128 + signalNumber : 1;
};

const normalizeChildExitCode = (code, childSignal, forwardedSignal, tunnelReady) => {
  if (forwardedSignal) {
    return signalExitCode(forwardedSignal);
  }
  if (childSignal) {
    return signalExitCode(childSignal);
  }
  if (Number.isInteger(code)) {
    return code === 0 && !tunnelReady ? 1 : code;
  }
  return 1;
};

const waitForCloudflaredExit = (
  child,
  {
    signalSource = process,
    consoleRef = console,
    shutdownTimeoutMs = CHILD_SHUTDOWN_TIMEOUT_MS,
  } = {},
) => new Promise((resolve) => {
  let settled = false;
  let forwardedSignal = null;
  let forceKillTimer = null;
  let tunnelReady = false;

  const cleanup = () => {
    signalSource.removeListener('SIGINT', onSigint);
    signalSource.removeListener('SIGTERM', onSigterm);
    child.removeListener('tunnel-ready', onTunnelReady);
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
  };

  const finish = (exitCode) => {
    if (settled) {
      return;
    }
    settled = true;
    cleanup();
    resolve(exitCode);
  };

  const forwardSignal = (signal) => {
    if (settled) {
      return;
    }
    if (forwardedSignal) {
      try {
        child.kill('SIGKILL');
      } catch {
        // The child may have exited between the signal and this fallback.
      }
      return;
    }

    forwardedSignal = signal;
    consoleRef.log('  收到 ' + signal + '，正在停止 cloudflared...');
    let signalSent = false;
    try {
      signalSent = child.kill(signal);
    } catch {
      try {
        signalSent = child.kill('SIGKILL');
      } catch {
        signalSent = false;
      }
    }
    if (!signalSent) {
      finish(signalExitCode(signal));
      return;
    }

    forceKillTimer = setTimeout(() => {
      try {
        if (!child.kill('SIGKILL')) {
          finish(signalExitCode(signal));
        }
      } catch {
        finish(signalExitCode(signal));
      }
    }, shutdownTimeoutMs);
    if (typeof forceKillTimer.unref === 'function') {
      forceKillTimer.unref();
    }
  };
  const onSigint = () => forwardSignal('SIGINT');
  const onSigterm = () => forwardSignal('SIGTERM');
  const onTunnelReady = () => {
    tunnelReady = true;
  };

  signalSource.once('SIGINT', onSigint);
  signalSource.once('SIGTERM', onSigterm);
  child.once('tunnel-ready', onTunnelReady);

  child.once('error', (error) => {
    if (settled) {
      return;
    }
    if (error.code === 'ENOENT') {
      consoleRef.error('\x1b[31m✗ cloudflared 未安装或路径无效\x1b[0m');
      consoleRef.log('  可设置 CLOUDFLARED_PATH，或运行: winget install Cloudflare.cloudflared');
    } else {
      consoleRef.error('\x1b[31m✗ 隧道启动失败: ' + error.message + '\x1b[0m');
    }
    finish(1);
  });

  child.once('close', (code, childSignal) => {
    if (settled) {
      return;
    }
    const exitCode = normalizeChildExitCode(
      code,
      childSignal,
      forwardedSignal,
      tunnelReady,
    );
    consoleRef.log('\n\x1b[33m隧道已断开 (exit ' + exitCode + ')\x1b[0m');
    finish(exitCode);
  });
});

const runTunnel = async ({
  port,
  cloudflaredCommand,
  protocol = resolveTunnelProtocol(),
  readinessCheck = isLocalTargetReady,
  spawnProcess = spawn,
  signalSource = process,
  consoleRef = console,
  stdout = process.stdout,
  stderr = process.stderr,
  preflightTimeoutMs = PREFLIGHT_TIMEOUT_MS,
  shutdownTimeoutMs = CHILD_SHUTDOWN_TIMEOUT_MS,
} = {}) => {
  const resolvedPort = port === undefined ? resolveTunnelPort() : parsePort(port);
  if (resolvedPort === null) {
    throw new Error('无效的前端端口: ' + port);
  }

  const targetUrl = 'http://127.0.0.1:' + resolvedPort;
  const command = cloudflaredCommand || resolveCloudflaredCommand();
  printBanner(consoleRef, targetUrl);
  consoleRef.log('  Protocol: ' + protocol);

  if (!await readinessCheck(targetUrl, { timeoutMs: preflightTimeoutMs })) {
    consoleRef.error('\x1b[31m✗ 本地前端未就绪: ' + targetUrl + '\x1b[0m');
    consoleRef.log('  请先启动前端，或把实际前端端口作为参数传入。');
    return 1;
  }

  let child;
  try {
    child = startCloudflareTunnel({
      command,
      targetUrl,
      protocol,
      spawnProcess,
      consoleRef,
      stdout,
      stderr,
    });
  } catch (error) {
    consoleRef.error('\x1b[31m✗ 隧道启动失败: ' + error.message + '\x1b[0m');
    return 1;
  }

  return waitForCloudflaredExit(child, {
    signalSource,
    consoleRef,
    shutdownTimeoutMs,
  });
};

if (require.main === module) {
  runTunnel()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error('\x1b[31m✗ 隧道启动失败: ' + error.message + '\x1b[0m');
      process.exitCode = 1;
    });
}

module.exports = {
  DEFAULT_FRONTEND_PORT,
  isLocalTargetReady,
  normalizeChildExitCode,
  parsePort,
  readConfiguredFrontendPort,
  resolveCloudflaredCommand,
  resolveTunnelProtocol,
  resolveTunnelPort,
  runTunnel,
  startCloudflareTunnel,
  waitForCloudflaredExit,
};
