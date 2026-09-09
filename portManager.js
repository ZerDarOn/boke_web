/**
 * Cross-platform port selection for the local launcher.
 *
 * The manager never terminates an unrelated process. When a configured port is
 * busy it selects the next available port and persists that choice.
 */

const fs = require('fs');
const net = require('net');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.port-config.json');
const DEFAULT_PORTS = Object.freeze({
  frontendPort: 5173,
  backendPort: 3001,
});
const MAX_PORT_SEARCH_ATTEMPTS = 20;

const isValidPort = (value) => Number.isInteger(value) && value > 0 && value <= 65535;

const canListenOnPort = (port) => new Promise((resolve) => {
  const server = net.createServer();

  server.unref();
  server.once('error', () => resolve(false));
  server.listen({ port, exclusive: true }, () => {
    server.close(() => resolve(true));
  });
});

const checkPort = async (port) => {
  if (!isValidPort(port)) {
    throw new RangeError(`Invalid port: ${port}`);
  }

  const available = await canListenOnPort(port);
  return {
    inUse: !available,
    processes: [],
    timeWaitOnly: false,
  };
};

const findAvailablePort = async (
  startPort,
  maxAttempts = MAX_PORT_SEARCH_ATTEMPTS,
  excludedPorts = new Set(),
) => {
  if (!isValidPort(startPort)) {
    throw new RangeError(`Invalid starting port: ${startPort}`);
  }

  for (let offset = 1; offset <= maxAttempts; offset += 1) {
    const candidate = startPort + offset;
    if (!isValidPort(candidate)) {
      break;
    }

    if (!excludedPorts.has(candidate) && await canListenOnPort(candidate)) {
      return candidate;
    }
  }

  return null;
};

const choosePort = async (configuredPort, serviceName, excludedPorts = new Set()) => {
  if (!excludedPorts.has(configuredPort) && await canListenOnPort(configuredPort)) {
    return configuredPort;
  }

  const availablePort = await findAvailablePort(
    configuredPort,
    MAX_PORT_SEARCH_ATTEMPTS,
    excludedPorts,
  );
  if (availablePort === null) {
    throw new Error(`${serviceName} 在 ${configuredPort} 之后没有可用端口`);
  }

  console.warn(`\u001b[33m⚠\u001b[0m ${serviceName} 端口 ${configuredPort} 已占用，改用 ${availablePort}`);
  return availablePort;
};

const readConfiguredPorts = () => {
  try {
    const savedPorts = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return {
      frontendPort: isValidPort(savedPorts.frontendPort)
        ? savedPorts.frontendPort
        : DEFAULT_PORTS.frontendPort,
      backendPort: isValidPort(savedPorts.backendPort)
        ? savedPorts.backendPort
        : DEFAULT_PORTS.backendPort,
    };
  } catch {
    return { ...DEFAULT_PORTS };
  }
};

const preparePorts = async () => {
  const configuredPorts = readConfiguredPorts();
  const frontendPort = await choosePort(configuredPorts.frontendPort, '前端');
  const backendPort = await choosePort(
    configuredPorts.backendPort,
    '后端',
    new Set([frontendPort]),
  );
  const selectedPorts = { frontendPort, backendPort };

  if (
    selectedPorts.frontendPort !== configuredPorts.frontendPort
    || selectedPorts.backendPort !== configuredPorts.backendPort
  ) {
    fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(selectedPorts, null, 2)}\n`, 'utf8');
  }

  return selectedPorts;
};

const handlePortConflict = async (port, serviceName) => choosePort(port, serviceName);

const cleanupZombieProcesses = async () => {
  // A listening port does not prove ownership, so the launcher deliberately avoids
  // killing processes it did not create. preparePorts() safely routes around them.
  return true;
};

const setupExitHandler = (processes = []) => {
  let shuttingDown = false;

  const stopChildren = () => {
    for (const child of processes) {
      try {
        if (child && !child.killed) {
          child.kill('SIGTERM');
        }
      } catch {
        // The process may already have exited between the state check and kill.
      }
    }
  };

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    stopChildren();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('exit', stopChildren);
};

module.exports = {
  checkPort,
  findAvailablePort,
  handlePortConflict,
  preparePorts,
  cleanupZombieProcesses,
  setupExitHandler,
};
