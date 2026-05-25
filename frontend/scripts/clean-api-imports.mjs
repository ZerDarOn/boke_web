import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/api');
const keepFull = new Set(['auth.ts', 'settings.ts', 'files.ts', 'request.ts', 'client.ts']);

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.ts') || keepFull.has(file)) continue;
  const fp = path.join(dir, file);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('getAuthHeaders') && !src.includes('getAuthToken')) continue;
  if (src.includes('getAuthHeaders(') || src.includes('getAuthToken(')) continue;
  src = src.replace(
    /import \{ apiRequest, getAuthHeaders, getAuthToken \} from '\.\/request';/,
    "import { apiRequest } from './request';"
  );
  fs.writeFileSync(fp, src);
  console.log('Cleaned', file);
}
