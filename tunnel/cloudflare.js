/**
 * Cloudflare Tunnel 启动脚本
 * 
 * 使用方法：
 * 1. 确保已安装 cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
 * 2. 运行: node cloudflare.js
 * 
 * 特点：
 * - 免费，无需域名
 * - URL 可以固定（需要登录 Cloudflare 账号）
 * - 流量经过 Cloudflare 防护
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 加载配置
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 检查是否有动态端口配置（由 start.js 生成）
const portConfigPath = path.join(__dirname, '..', '.port-config.json');
let FRONTEND_PORT = config.frontendPort || 5173;
let BACKEND_PORT = config.backendPort || 3001;

if (fs.existsSync(portConfigPath)) {
  try {
    const portConfig = JSON.parse(fs.readFileSync(portConfigPath, 'utf-8'));
    FRONTEND_PORT = portConfig.frontendPort || FRONTEND_PORT;
    BACKEND_PORT = portConfig.backendPort || BACKEND_PORT;
    console.log(`📡 使用动态端口配置: 前端=${FRONTEND_PORT}, 后端=${BACKEND_PORT}`);
  } catch (e) {
    console.log('⚠️  读取端口配置失败，使用默认端口');
  }
}

let tunnelUrl = null;

console.log('');
console.log('╔════════════════════════════════════════════╗');
console.log('║     INK.SPIRIT Cloudflare Tunnel          ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');

// 检查 cloudflared 是否安装（优先使用本地版本）
const checkCloudflared = () => {
  return new Promise((resolve) => {
    // 优先使用本地 cloudflared.exe
    const localCloudflared = path.join(__dirname, 'cloudflared.exe');
    if (fs.existsSync(localCloudflared)) {
      console.log('✓ 使用本地 cloudflared.exe');
      return resolve(localCloudflared);
    }
    
    // 否则检查系统 PATH
    const check = spawn('cloudflared', ['--version'], { shell: true });
    check.on('close', (code) => {
      resolve(code === 0 ? 'cloudflared' : null);
    });
    check.on('error', () => {
      resolve(null);
    });
  });
};

// 提取隧道 URL
const extractUrl = (output) => {
  // 尝试多种格式匹配
  const patterns = [
    /https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.trycloudflare\.com/g,
    /https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.trycloudflare\.com/g,
    /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g,
    /Your quick Tunnel has been created.*?(https:\/\/[^\s]+)/is,
    /Visit it at.*?(https:\/\/[^\s]+)/is,
  ];
  
  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      // 如果是全局匹配，取第一个
      const url = Array.isArray(match) ? match[0] : match[1] || match[0];
      // 清理 URL（去掉可能的尾随字符）
      return url.replace(/[^a-zA-Z0-9-:.\/]/g, '');
    }
  }
  return null;
};

// 启动前端隧道
const startFrontendTunnel = (cloudflaredPath) => {
  console.log('🚀 启动前端隧道...');
  console.log(`   本地端口: ${FRONTEND_PORT}`);
  console.log('');

  // 使用 127.0.0.1 避免 IPv6 解析问题
  const tunnel = spawn(cloudflaredPath, ['tunnel', '--url', `http://127.0.0.1:${FRONTEND_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let urlFound = false;

  const handleOutput = (data, isStderr = false) => {
    const output = data.toString();
    
    // 如果还没找到 URL，尝试提取
    if (!urlFound) {
      const url = extractUrl(output);
      if (url && url.includes('trycloudflare.com') && url.length > 30) {
        tunnelUrl = url;
        urlFound = true;
        
        console.log('');
        console.log('════════════════════════════════════════════');
        console.log('🎉 前端隧道已就绪！');
        console.log(`   公网地址: ${url}`);
        console.log('════════════════════════════════════════════');
        console.log('');
        console.log('📌 使用说明:');
        console.log(`   1. 打开浏览器访问: ${url}`);
        console.log('   2. 把这个地址分享给朋友即可访问');
        console.log('   3. 按 Ctrl+C 停止隧道');
        console.log('');
        
        // 保存 URL 到文件
        const tunnelInfo = {
          frontend: url,
          backend: `${url}/api`, // 后端 API 通过同域名代理
          startedAt: new Date().toISOString(),
          provider: 'cloudflare'
        };
        fs.writeFileSync(
          path.join(__dirname, 'tunnel-info.json'),
          JSON.stringify(tunnelInfo, null, 2)
        );
      }
    }
    
    // 只打印重要日志
    if (output.includes('error') || output.includes('Error') || output.includes('failed')) {
      console.log('⚠️ ', output.trim());
    }
  };

  tunnel.stdout.on('data', (data) => handleOutput(data, false));
  tunnel.stderr.on('data', (data) => handleOutput(data, true));

  tunnel.on('error', (err) => {
    console.error('❌ 隧道启动失败:', err.message);
    console.log('');
    console.log('💡 请确保已安装 cloudflared:');
    console.log('   Windows: winget install Cloudflare.cloudflared');
    console.log('   或下载: https://github.com/cloudflare/cloudflared/releases');
  });

  tunnel.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`隧道进程退出，代码: ${code}`);
    }
  });

  return tunnel;
};

// 主函数
const main = async () => {
  const cloudflaredPath = await checkCloudflared();
  
  if (!cloudflaredPath) {
    console.log('❌ cloudflared 未安装或不在 PATH 中');
    console.log('');
    console.log('📥 安装方法:');
    console.log('');
    console.log('   Windows (推荐):');
    console.log('   winget install Cloudflare.cloudflared');
    console.log('');
    console.log('   或手动下载:');
    console.log('   https://github.com/cloudflare/cloudflared/releases');
    console.log('');
    process.exit(1);
  }

  console.log('✅ cloudflared 已就绪');
  console.log('');
  console.log('⏳ 正在建立隧道连接，请稍候...');
  console.log('');

  // 启动前端隧道
  const frontendTunnel = startFrontendTunnel(cloudflaredPath);

  // 处理退出
  process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 正在关闭隧道...');
    frontendTunnel.kill();
    process.exit(0);
  });
};

main();
