/**
 * 隧道入口脚本
 * 根据配置自动选择隧道提供商
 */

const path = require('path');
const fs = require('fs');

// 加载配置
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const provider = config.provider || 'ngrok';

console.log('');
console.log(`📦 当前隧道提供商: ${provider}`);
console.log('');

// 根据配置加载对应的隧道脚本
if (provider === 'cloudflare') {
  require('./cloudflare.js');
} else if (provider === 'ngrok') {
  require('./ngrok.js');
} else {
  console.error(`❌ 未知的隧道提供商: ${provider}`);
  console.log('   支持: cloudflare, ngrok');
  process.exit(1);
}
