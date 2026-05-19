/**
 * ngrok Tunnel 启动脚本 (npm 版本)
 * 
 * 使用方法：
 * 1. npm install ngrok --save-dev（已安装）
 * 2. 运行: node ngrok.js
 * 
 * 特点：
 * - 免费版可用，无需注册
 * - 一行命令即可使用
 * - URL 每次启动会变化
 */

const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

// 加载配置
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const FRONTEND_PORT = config.frontendPort || 5173;
const BACKEND_PORT = config.backendPort || 3001;

console.log('');
console.log('╔════════════════════════════════════════════╗');
console.log('║        INK.SPIRIT ngrok Tunnel            ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');

// 启动隧道
const startTunnel = async () => {
  try {
    console.log('🚀 启动前端隧道...');
    console.log(`   本地端口: ${FRONTEND_PORT}`);
    console.log('');

    // 连接 ngrok
    const url = await ngrok.connect({
      addr: FRONTEND_PORT,
      // 免费版不需要 authtoken
      // 如果有账号可以添加: authtoken: 'your-token'
    });

    console.log('════════════════════════════════════════════');
    console.log('🎉 前端隧道已就绪！');
    console.log(`   公网地址: ${url}`);
    console.log('════════════════════════════════════════════');
    console.log('');
    console.log('📌 提示:');
    console.log('   - 免费版 URL 每次启动会变化');
    console.log('   - 前端访问后端需要配置 CORS');
    console.log('   - 按 Ctrl+C 停止隧道');
    console.log('');

    // 保存 URL 到文件
    const tunnelInfo = {
      frontend: url,
      backend: null,
      startedAt: new Date().toISOString(),
      provider: 'ngrok'
    };
    fs.writeFileSync(
      path.join(__dirname, 'tunnel-info.json'),
      JSON.stringify(tunnelInfo, null, 2)
    );

    // 管理 API（可选，查看隧道状态）
    const api = ngrok.getApi();
    if (api) {
      console.log('📊 ngrok 管理界面: http://127.0.0.1:4040');
      console.log('');
    }

  } catch (err) {
    console.error('❌ 隧道启动失败:', err.message);
    console.log('');
    console.log('💡 可能的原因:');
    console.log('   - 端口 ' + FRONTEND_PORT + ' 未启动');
    console.log('   - 网络连接问题');
    console.log('   - ngrok 服务不可用');
    console.log('');
    process.exit(1);
  }
};

// 处理退出
process.on('SIGINT', async () => {
  console.log('');
  console.log('🛑 正在关闭隧道...');
  try {
    await ngrok.kill();
    console.log('✅ 隧道已关闭');
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

// 启动
startTunnel();
