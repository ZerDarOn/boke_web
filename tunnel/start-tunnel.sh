#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║      INK.SPIRIT Tunnel Manager            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 读取配置
provider=$(grep '"provider"' config.json | cut -d'"' -f4)
if [ -z "$provider" ]; then
    provider="cloudflare"
fi

echo "当前隧道提供商: $provider"
echo ""

# 启动对应的隧道
case $provider in
    cloudflare)
        echo "正在启动 Cloudflare Tunnel..."
        node cloudflare.js
        ;;
    ngrok)
        echo "正在启动 ngrok Tunnel..."
        node ngrok.js
        ;;
    *)
        echo "❌ 未知的隧道提供商: $provider"
        echo "   请编辑 config.json 修改 provider 为 cloudflare 或 ngrok"
        exit 1
        ;;
esac
