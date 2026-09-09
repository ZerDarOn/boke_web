import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { resolveBackendEnvPath, resolveBackendRoot } from '../src/config/backend-env-path';

const repositoryRoot = path.resolve(__dirname, '..', '..');
const backendRoot = path.join(repositoryRoot, 'backend');
const launcherModule = require(path.join(repositoryRoot, 'start.js')) as {
  setupLauncherExitHandler: (
    processes: Array<Record<string, unknown>>,
    options: Record<string, unknown>,
  ) => void;
  stopChildProcess: (
    child: { pid: number; kill: (signal?: NodeJS.Signals | number) => boolean },
    options: Record<string, unknown>,
  ) => void;
};
const tunnelModule = require(path.join(repositoryRoot, 'tunnel', 'index.js')) as {
  normalizeChildExitCode: (
    code: number | null,
    childSignal: NodeJS.Signals | null,
    forwardedSignal: NodeJS.Signals | null,
    tunnelReady: boolean,
  ) => number;
  resolveTunnelPort: (argv?: string[], configPath?: string) => number;
  resolveTunnelProtocol: (env?: Record<string, string | undefined>) => string;
  isLocalTargetReady: (targetUrl: string, options?: { timeoutMs?: number }) => Promise<boolean>;
  runTunnel: (options: Record<string, unknown>) => Promise<number>;
};

type FakeTunnelProcess = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  killed: boolean;
  killSignals: Array<NodeJS.Signals | number>;
  kill: (signal?: NodeJS.Signals | number) => boolean;
};

const createFakeTunnelProcess = (): FakeTunnelProcess => {
  const process = new EventEmitter() as FakeTunnelProcess;
  process.stdout = new EventEmitter();
  process.stderr = new EventEmitter();
  process.killed = false;
  process.killSignals = [];
  process.kill = (signal = 'SIGTERM') => {
    process.killed = true;
    process.killSignals.push(signal);
    queueMicrotask(() => process.emit('close', null, signal));
    return true;
  };
  return process;
};

const silentConsole = { log: () => undefined, error: () => undefined };
const silentStream = { write: () => true };

test('resolves the backend root from source and compiled module locations', () => {
  const sourceModuleDirectory = path.join(backendRoot, 'src', 'config');
  const compiledModuleDirectory = path.join(backendRoot, 'dist', 'backend', 'src', 'config');

  assert.equal(resolveBackendRoot(sourceModuleDirectory), backendRoot);
  assert.equal(resolveBackendRoot(compiledModuleDirectory), backendRoot);
  assert.equal(resolveBackendEnvPath(compiledModuleDirectory), path.join(backendRoot, '.env'));
});

test('the root production build invokes both backend and frontend builds', () => {
  const launcher = fs.readFileSync(path.join(repositoryRoot, 'start.js'), 'utf8');
  const buildCase = launcher.match(/case 'build':([\s\S]*?)case 'tunnel':/)?.[1] ?? '';

  assert.match(buildCase, /await buildBackend\(\)/);
  assert.match(buildCase, /await buildFrontend\(\)/);
});

test('file storage initialization is awaited before the HTTP server listens', () => {
  const appSource = fs.readFileSync(path.join(backendRoot, 'src', 'app.ts'), 'utf8');
  const indexSource = fs.readFileSync(path.join(backendRoot, 'src', 'index.ts'), 'utf8');
  const uploadServiceSource = fs.readFileSync(
    path.join(backendRoot, 'src', 'services', 'upload.service.ts'),
    'utf8',
  );
  const initializationPosition = indexSource.indexOf('await fileService.initialize()');
  const listenPosition = indexSource.indexOf('app.listen(PORT');

  assert.equal(appSource.includes('fileService.initialize()'), false);
  assert.ok(initializationPosition >= 0);
  assert.ok(listenPosition > initializationPosition);
  assert.doesNotMatch(uploadServiceSource, /initializeMinIO\(\)/);
});

test('the games foundation migration is ordered before media highlights and safe to re-run', () => {
  const migrationsRoot = path.join(backendRoot, 'prisma', 'migrations');
  const gameMigrationName = '20260821150000_create_games';
  const highlightsMigrationName = '20260821160000_add_media_highlights';
  const migration = fs.readFileSync(
    path.join(migrationsRoot, gameMigrationName, 'migration.sql'),
    'utf8',
  );

  assert.ok(gameMigrationName < highlightsMigrationName);
  assert.match(migration, /CREATE TYPE "GamePlatform"/);
  assert.match(migration, /CREATE TYPE "GameStatus"/);
  assert.match(migration, /EXCEPTION\s+WHEN duplicate_object THEN NULL/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "games"/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS "games_status_idx"/);
  assert.doesNotMatch(migration, /"highlights"/);
});

test('legacy db-push highlight compatibility brackets the unchanged historical migration', () => {
  const migrationsRoot = path.join(backendRoot, 'prisma', 'migrations');
  const preserveMigrationName = '20260821155000_preserve_db_push_media_highlights';
  const highlightsMigrationName = '20260821160000_add_media_highlights';
  const restoreMigrationName = '20260821170000_restore_db_push_media_highlights';
  const highlightsMigration = fs.readFileSync(
    path.join(migrationsRoot, highlightsMigrationName, 'migration.sql'),
  );
  const preserveMigration = fs.readFileSync(
    path.join(migrationsRoot, preserveMigrationName, 'migration.sql'),
    'utf8',
  );
  const restoreMigration = fs.readFileSync(
    path.join(migrationsRoot, restoreMigrationName, 'migration.sql'),
    'utf8',
  );

  assert.ok(preserveMigrationName < highlightsMigrationName);
  assert.ok(highlightsMigrationName < restoreMigrationName);
  assert.equal(
    crypto.createHash('sha256').update(highlightsMigration).digest('hex'),
    '45f85c19034f76a263cfab283df66b1ec5c38b6eb805c48bb2a7fdd1d8820cbd',
  );
  assert.match(preserveMigration, /"finished_at" IS NOT NULL/);
  assert.match(preserveMigration, /ALTER TABLE "anime"[\s\S]*RENAME COLUMN "highlights"/);
  assert.match(preserveMigration, /ALTER TABLE "games"[\s\S]*RENAME COLUMN "highlights"/);
  assert.match(restoreMigration, /UPDATE "anime"[\s\S]*COALESCE/);
  assert.match(restoreMigration, /UPDATE "games"[\s\S]*COALESCE/);
  assert.match(restoreMigration, /DROP COLUMN "__legacy_db_push_highlights"/);
});

test('the AI Docker context excludes secrets and runtime data', () => {
  const dockerIgnore = fs.readFileSync(path.join(repositoryRoot, 'ai-service', '.dockerignore'), 'utf8');

  for (const ignoredPath of ['.env', 'chroma_data/', 'kb_data/', '__pycache__/', 'tests/', '*.log']) {
    assert.match(dockerIgnore, new RegExp(`^${ignoredPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
});

test('the smart launcher has a port manager implementation', () => {
  const managerPath = path.join(repositoryRoot, 'portManager.js');
  assert.equal(fs.existsSync(managerPath), true);

  const manager = require(managerPath) as Record<string, unknown>;
  for (const method of ['preparePorts', 'cleanupZombieProcesses', 'setupExitHandler']) {
    assert.equal(typeof manager[method], 'function');
  }
});

test('the launcher terminates only the exact child process tree on Windows', () => {
  const calls: Array<{ command: string; args: string[] }> = [];
  const child = {
    pid: 4242,
    kill: () => {
      throw new Error('direct kill should not be used when taskkill succeeds');
    },
  };

  launcherModule.stopChildProcess(child, {
    platform: 'win32',
    taskkillProcess: (command: string, args: string[]) => {
      calls.push({ command, args });
      return { error: undefined, status: 0 };
    },
  });

  assert.deepEqual(calls, [{
    command: 'taskkill.exe',
    args: ['/PID', '4242', '/T', '/F'],
  }]);

  let exitedChildKillCalls = 0;
  launcherModule.stopChildProcess({
    pid: 4343,
    exitCode: 0,
    signalCode: null,
    kill: () => {
      exitedChildKillCalls += 1;
      return true;
    },
  }, {
    platform: 'win32',
    taskkillProcess: (command: string, args: string[]) => {
      calls.push({ command, args });
      return { error: undefined, status: 0 };
    },
  });

  assert.equal(exitedChildKillCalls, 0);
  assert.equal(calls.length, 1);
});

test('the tunnel launcher wires the selected frontend port and monitors failures', () => {
  const launcher = fs.readFileSync(path.join(repositoryRoot, 'start.js'), 'utf8');
  const processesIndex = launcher.indexOf('const processes = []');
  const exitHandlerIndex = launcher.indexOf(
    'setupLauncherExitHandler(processes)',
    processesIndex,
  );
  const firstServiceStartIndex = launcher.indexOf(
    'processes.push(await startBackend',
    processesIndex,
  );

  assert.ok(
    processesIndex >= 0
      && exitHandlerIndex > processesIndex
      && exitHandlerIndex < firstServiceStartIndex,
  );
  assert.equal(
    launcher.indexOf('setupLauncherExitHandler(processes)', exitHandlerIndex + 1),
    -1,
  );
  assert.match(launcher, /const startTunnel = \(port\) =>/);
  assert.match(launcher, /\['index\.js', String\(port\)\]/);
  assert.match(launcher, /startTunnel\(ports\.frontendPort\)/);
  assert.match(launcher, /tunnelProc\.on\('close', \(code\) => process\.exit\(code \?\? 1\)\)/);
  assert.match(launcher, /monitorTunnelProcess\(tunnelProc, processes\)/);
});

test('the early launcher exit handler cleans children appended after registration', () => {
  const signalSource = new EventEmitter();
  const processes: Array<Record<string, unknown>> = [];
  const taskkillCalls: Array<{ command: string; args: string[] }> = [];
  const exitCodes: number[] = [];

  launcherModule.setupLauncherExitHandler(processes, {
    signalSource,
    exitProcess: (code: number) => exitCodes.push(code),
    stopOptions: {
      platform: 'win32',
      taskkillProcess: (command: string, args: string[]) => {
        taskkillCalls.push({ command, args });
        return { error: undefined, status: 0 };
      },
    },
  });
  processes.push({
    pid: 4545,
    exitCode: null,
    signalCode: null,
    kill: () => true,
  });

  signalSource.emit('SIGTERM');

  assert.deepEqual(taskkillCalls, [{
    command: 'taskkill.exe',
    args: ['/PID', '4545', '/T', '/F'],
  }]);
  assert.deepEqual(exitCodes, [0]);
});

test('the standalone tunnel resolves explicit and configured frontend ports', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-spirit-tunnel-'));
  const configPath = path.join(temporaryRoot, '.port-config.json');

  try {
    fs.writeFileSync(configPath, JSON.stringify({ frontendPort: 43123 }), 'utf8');
    assert.equal(tunnelModule.resolveTunnelPort(['node', 'index.js'], configPath), 43123);
    assert.equal(tunnelModule.resolveTunnelPort(['node', 'index.js', '44123'], configPath), 44123);
    assert.throws(
      () => tunnelModule.resolveTunnelPort(['node', 'index.js', 'invalid'], configPath),
      /无效的前端端口/,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('the tunnel protocol is configurable but fails closed to HTTP/2', () => {
  assert.equal(tunnelModule.resolveTunnelProtocol({}), 'http2');
  assert.equal(
    tunnelModule.resolveTunnelProtocol({ CLOUDFLARED_PROTOCOL: 'QUIC' }),
    'quic',
  );
  assert.equal(
    tunnelModule.resolveTunnelProtocol({ CLOUDFLARED_PROTOCOL: 'invalid' }),
    'http2',
  );
});

test('the tunnel preflight accepts a ready target and enforces an absolute timeout', async () => {
  const server = http.createServer((request, response) => {
    if (request.url === '/ready') {
      response.writeHead(204);
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    const origin = 'http://127.0.0.1:' + address.port;
    assert.equal(
      await tunnelModule.isLocalTargetReady(origin + '/ready', { timeoutMs: 200 }),
      true,
    );
    const startedAt = Date.now();
    assert.equal(
      await tunnelModule.isLocalTargetReady(origin + '/hang', { timeoutMs: 50 }),
      false,
    );
    assert.ok(Date.now() - startedAt < 1000);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('the tunnel waits for an edge connection and reports a missing binary', async () => {
  let capturedArgs: string[] = [];
  const successfulProcess = createFakeTunnelProcess();
  const successfulRun = tunnelModule.runTunnel({
    port: 45123,
    cloudflaredCommand: 'fake-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: (_command: string, args: string[]) => {
      capturedArgs = args;
      queueMicrotask(() => {
        successfulProcess.stdout.emit(
          'data',
          'Your quick Tunnel has been created!\n'
            + 'https://ready.trycloudflare.com\n'
            + 'Registered tunnel connection\n',
        );
        successfulProcess.emit('close', 0, null);
      });
      return successfulProcess;
    },
    signalSource: new EventEmitter(),
    consoleRef: silentConsole,
    stdout: silentStream,
    stderr: silentStream,
  });

  assert.equal(await successfulRun, 0);
  assert.deepEqual(capturedArgs, [
    'tunnel',
    '--url', 'http://127.0.0.1:45123',
    '--protocol', 'http2',
    '--no-autoupdate',
  ]);

  const missingProcess = createFakeTunnelProcess();
  const missingMessages: string[] = [];
  const missingBinaryError = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
  const missingRun = tunnelModule.runTunnel({
    port: 45124,
    cloudflaredCommand: 'missing-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: () => {
      queueMicrotask(() => {
        missingProcess.emit('error', missingBinaryError);
        missingProcess.emit('close', 0, null);
      });
      return missingProcess;
    },
    signalSource: new EventEmitter(),
    consoleRef: {
      log: (message: string) => missingMessages.push(message),
      error: (message: string) => missingMessages.push(message),
    },
    stdout: silentStream,
    stderr: silentStream,
  });

  assert.equal(await missingRun, 1);
  assert.equal(missingMessages.some((message) => message.includes('隧道已断开')), false);
  assert.equal(tunnelModule.normalizeChildExitCode(0, null, null, false), 1);
  assert.equal(tunnelModule.normalizeChildExitCode(7, null, null, false), 7);
  assert.equal(tunnelModule.normalizeChildExitCode(null, 'SIGTERM', null, false), 143);
});

test('the tunnel rejects API error URLs and unregistered hostnames', async () => {
  const apiErrorProcess = createFakeTunnelProcess();
  const apiMessages: string[] = [];
  const apiRun = tunnelModule.runTunnel({
    port: 45127,
    cloudflaredCommand: 'fake-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: () => {
      queueMicrotask(() => {
        apiErrorProcess.stderr.emit(
          'data',
          'failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel"\n',
        );
        apiErrorProcess.emit('close', 1, null);
      });
      return apiErrorProcess;
    },
    signalSource: new EventEmitter(),
    consoleRef: {
      log: (message: string) => apiMessages.push(message),
      error: (message: string) => apiMessages.push(message),
    },
    stdout: silentStream,
    stderr: silentStream,
  });

  assert.equal(await apiRun, 1);
  assert.equal(apiMessages.some((message) => message.includes('公网链接')), false);

  const unregisteredProcess = createFakeTunnelProcess();
  const unregisteredRun = tunnelModule.runTunnel({
    port: 45128,
    cloudflaredCommand: 'fake-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: () => {
      queueMicrotask(() => {
        unregisteredProcess.stdout.emit(
          'data',
          'Your quick Tunnel has been created!\nhttps://not-ready.trycloudflare.com\n',
        );
        unregisteredProcess.emit('close', 0, null);
      });
      return unregisteredProcess;
    },
    signalSource: new EventEmitter(),
    consoleRef: silentConsole,
    stdout: silentStream,
    stderr: silentStream,
  });

  assert.equal(await unregisteredRun, 1);
});

test('the tunnel forwards termination signals and never treats a signal exit as success', async () => {
  const signalSource = new EventEmitter();
  const child = createFakeTunnelProcess();
  const run = tunnelModule.runTunnel({
    port: 45125,
    cloudflaredCommand: 'fake-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: () => child,
    signalSource,
    consoleRef: silentConsole,
    stdout: silentStream,
    stderr: silentStream,
  });

  setImmediate(() => signalSource.emit('SIGTERM'));
  assert.equal(await run, 143);
  assert.deepEqual(child.killSignals, ['SIGTERM']);

  const fallbackSignalSource = new EventEmitter();
  const fallbackChild = createFakeTunnelProcess();
  fallbackChild.kill = (signal = 'SIGTERM') => {
    fallbackChild.killSignals.push(signal);
    if (signal === 'SIGINT') {
      throw new Error('signal unsupported');
    }
    queueMicrotask(() => fallbackChild.emit('close', null, signal));
    return true;
  };
  const fallbackRun = tunnelModule.runTunnel({
    port: 45126,
    cloudflaredCommand: 'fake-cloudflared',
    readinessCheck: async () => true,
    spawnProcess: () => fallbackChild,
    signalSource: fallbackSignalSource,
    consoleRef: silentConsole,
    stdout: silentStream,
    stderr: silentStream,
  });

  setImmediate(() => fallbackSignalSource.emit('SIGINT'));
  assert.equal(await fallbackRun, 130);
  assert.deepEqual(fallbackChild.killSignals, ['SIGINT', 'SIGKILL']);
});

test('the Python launcher uses valid paths and the Vite default port', () => {
  const launcher = fs.readFileSync(path.join(repositoryRoot, 'start.py'), 'utf8');

  assert.doesNotMatch(launcher, /enco2ding|ai-serv2ice/);
  assert.match(launcher, /def read_backend_port\(\):\r?\n {4}"""/);
  assert.match(launcher, /AI_SERVICE_DIR = ROOT_DIR \/ "ai-service"/);
  assert.match(launcher, /read_text\(encoding='utf-8'\)/);
  assert.match(launcher, /DEFAULT_FRONTEND_PORT = 5173/);
  assert.match(launcher, /CLOUDFLARED_PATH/);
  assert.match(launcher, /DEFAULT_TUNNEL_PROTOCOL = "http2"/);
  assert.match(launcher, /TUNNEL_PROTOCOL = resolve_tunnel_protocol\(\)/);
  assert.match(launcher, /http:\/\/127\.0\.0\.1:\{FRONTEND_PORT\}/);
  assert.match(launcher, /tunnel_proc\.poll\(\)/);
  assert.match(launcher, /select_available_ports/);
  assert.match(launcher, /persist_selected_ports/);
  const initPorts = launcher.match(/def init_ports\(\):([\s\S]*?)# ── 停止服务/)?.[1] ?? '';
  assert.doesNotMatch(initPorts, /kill_port\(/);
  assert.match(launcher, /\[\s*"taskkill\.exe",[\s\S]*"\/PID", str\(process\.pid\),[\s\S]*"\/T",[\s\S]*"\/F"/);
  const shareMode = launcher.match(/def start_share\(\):([\s\S]*?)# ── 仅初始化/)?.[1] ?? '';
  assert.match(shareMode, /"--protocol", TUNNEL_PROTOCOL/);
  assert.match(shareMode, /TUNNEL_CONNECTED_MARKER/);
  const signalHandlerIndex = shareMode.indexOf(
    'install_process_cleanup_handlers(started_processes)',
  );
  const backendStartIndex = shareMode.indexOf('backend_proc = run_bg');
  assert.ok(signalHandlerIndex >= 0 && signalHandlerIndex < backendStartIndex);
  assert.match(shareMode, /finally:[\s\S]*finish_cleanup\(\)/);
  assert.match(shareMode, /timeout=SERVICE_START_TIMEOUT_SECONDS/);
  assert.doesNotMatch(shareMode, /terminate_started_processes\(started_processes\)/);
  const devMode = launcher.match(/def start_dev\(\):([\s\S]*?)# ── 预览/)?.[1] ?? '';
  assert.doesNotMatch(devMode, /已取消分享模式/);
});

test('the Python launcher provides diagnostics and managed cleanup in every local mode', () => {
  const launcher = fs.readFileSync(path.join(repositoryRoot, 'start.py'), 'utf8');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  const devMode = launcher.match(/def start_dev\(\):([\s\S]*?)# ── 预览/)?.[1] ?? '';
  const previewMode = launcher.match(/def start_preview\(\):([\s\S]*?)# ── 内网穿透/)?.[1] ?? '';
  const doctorMode = launcher.match(/def start_doctor\(\):([\s\S]*?)# ── /)?.[1] ?? '';

  assert.match(launcher, /def install_process_cleanup_handlers\(/);
  const terminationHelper = launcher.match(
    /def terminate_started_processes\([\s\S]*?(?=def install_process_cleanup_handlers)/,
  )?.[0] ?? '';
  assert.match(terminationHelper, /process\.wait\(timeout=3\)/);
  assert.match(terminationHelper, /process\.kill\(\)/);
  assert.match(devMode, /install_process_cleanup_handlers\(started_processes\)/);
  assert.match(previewMode, /install_process_cleanup_handlers\(started_processes\)/);
  assert.match(devMode, /finally:[\s\S]*finish_cleanup\(\)/);
  assert.match(previewMode, /finally:[\s\S]*finish_cleanup\(\)/);
  assert.doesNotMatch(devMode, /backend_proc\.terminate\(\)|frontend_proc\.terminate\(\)/);
  assert.doesNotMatch(previewMode, /backend_proc\.terminate\(\)|frontend_proc\.terminate\(\)/);
  assert.match(previewMode, /build_result\.returncode == 0/);

  assert.match(doctorMode, /resolve_cloudflared_command/);
  assert.match(doctorMode, /probe_tcp_endpoint/);
  assert.match(doctorMode, /api\.trycloudflare\.com/);
  assert.match(launcher, /choices=\[[^\]]*"doctor"/);
  assert.match(launcher, /"doctor":\s+start_doctor/);
  assert.equal(packageJson.scripts?.doctor, 'python start.py doctor');
});
