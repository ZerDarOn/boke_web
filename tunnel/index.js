/**
 * INK.SPIRIT Cloudflare Tunnel
 * 通过 cloudflared Quick Tunnel 暴露本地前端到公网。
 *
 * 用法:
 *   node tunnel/index.js [端口]      默认 3000
 *   node tunnel/index.js 3000
 *
 * 前提:
 *   - 安装 cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
 */

const { spawn } = require('child_process');

const PORT = process.argv[2] || '3000';
const TARGET_URL = `http://localhost:${PORT}`;

console.log('');
console.log('\x1b[35m╔═══════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[35m║  \x1b[36mINK.SPIRIT Cloudflare Tunnel\x1b[0m              \x1b[35m║\x1b[0m');
console.log('\x1b[35m╚═══════════════════════════════════════════╝\x1b[0m');
console.log('');
console.log(`  Target : ${TARGET_URL}`);
console.log('');

try {
  const proc = spawn('cloudflared', [
    'tunnel',
    '--url', TARGET_URL,
    '--no-autoupdate',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let tunnelUrl = null;

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);

    // 提取 trycloudflare.com 链接
    if (!tunnelUrl) {
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
      if (match) {
        tunnelUrl = match[0];
        console.log('');
        console.log('\x1b[32m╔═══════════════════════════════════════════╗\x1b[0m');
        console.log(`\x1b[32m║  公网链接:\x1b[0m`);
        console.log(`\x1b[32m║  \x1b[1m\x1b[37m${tunnelUrl}\x1b[0m`);
        console.log('\x1b[32m╚═══════════════════════════════════════════╝\x1b[0m');
        console.log('');
        console.log('  按 Ctrl+C 停止隧道');
        console.log('');
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);

    if (!tunnelUrl) {
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
      if (match) {
        tunnelUrl = match[0];
        console.log('');
        console.log('\x1b[32m╔═══════════════════════════════════════════╗\x1b[0m');
        console.log(`\x1b[32m║  公网链接:\x1b[0m`);
        console.log(`\x1b[32m║  \x1b[1m\x1b[37m${tunnelUrl}\x1b[0m`);
        console.log('\x1b[32m╚═══════════════════════════════════════════╝\x1b[0m');
        console.log('');
        console.log('  按 Ctrl+C 停止隧道');
        console.log('');
      }
    }
  });

  proc.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('\x1b[31m✗ cloudflared 未安装\x1b[0m');
      console.log('');
      console.log('  安装方法:');
      console.log('  winget install Cloudflare.cloudflared');
      console.log('  或访问 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
      console.log('');
    } else {
      console.error(`\x1b[31m✗ 隧道启动失败: ${err.message}\x1b[0m`);
    }
    process.exit(1);
  });

  proc.on('close', (code) => {
    console.log(`\n\x1b[33m隧道已断开 (exit ${code})\x1b[0m`);
    process.exit(code || 0);
  });
} catch (err) {
  console.error(`\x1b[31m✗ ${err.message}\x1b[0m`);
  process.exit(1);
}
