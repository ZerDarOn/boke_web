import fs from 'fs';
import path from 'path';

export function hasValidCursorSignature(filePath: string): boolean {
  try {
    const bytes = fs.readFileSync(filePath).subarray(0, 8);
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.cur') {
      return bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 2 && bytes[3] === 0;
    }
    if (extension === '.png') {
      return bytes.toString('hex') === '89504e470d0a1a0a';
    }
    return false;
  } catch {
    return false;
  }
}
