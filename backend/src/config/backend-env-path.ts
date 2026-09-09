import fs from 'node:fs';
import path from 'node:path';

const BACKEND_PACKAGE_NAME = 'ink-spirit-backend';

function isBackendPackage(directory: string): boolean {
  const packagePath = path.join(directory, 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { name?: string };
    return packageJson.name === BACKEND_PACKAGE_NAME;
  } catch {
    return false;
  }
}

/**
 * Locate the backend package independently of whether this module runs from
 * TypeScript source or from the nested TypeScript build output.
 */
export function resolveBackendRoot(startDirectory: string = __dirname): string {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (isBackendPackage(currentDirectory)) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      throw new Error(`Unable to locate ${BACKEND_PACKAGE_NAME} from ${startDirectory}`);
    }

    currentDirectory = parentDirectory;
  }
}

export function resolveBackendEnvPath(startDirectory: string = __dirname): string {
  return path.join(resolveBackendRoot(startDirectory), '.env');
}

export function resolveBackendRuntimePath(
  configuredPath: string | undefined,
  fallbackPath: string,
  startDirectory: string = __dirname
): string {
  const backendRoot = resolveBackendRoot(startDirectory);
  const selectedPath = configuredPath?.trim() || fallbackPath;
  return path.isAbsolute(selectedPath)
    ? path.resolve(selectedPath)
    : path.resolve(backendRoot, selectedPath);
}
