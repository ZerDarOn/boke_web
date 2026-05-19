import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
const DEFAULT_FRONTEND_PORT = 5173;

const getBackendPort = () => {
  const configPath = path.join(__dirname, '..', '.port-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.backendPort || 3001;
    } catch (e) {}
  }
  return 3001;
};

const getFrontendPort = () => {
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!Number.isNaN(port)) return port;
  }
  const configPath = path.join(__dirname, '..', '.port-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.frontendPort || DEFAULT_FRONTEND_PORT;
    } catch (e) {}
  }
  return DEFAULT_FRONTEND_PORT;
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendPort = getBackendPort();
    const frontendPort = getFrontendPort();
    
    const proxyConfig = {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
      '/rss.xml': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
    };
    
    // 共享的 allowedHosts
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      '.trycloudflare.com',  // Cloudflare Tunnel
      '.ngrok-free.app',      // ngrok
    ];
    
    return {
      server: {
        port: frontendPort,
        host: '0.0.0.0',
        allowedHosts,
        proxy: proxyConfig,
      },
      preview: {
        port: frontendPort,
        host: '0.0.0.0',
        allowedHosts,
        proxy: proxyConfig,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': ['lucide-react'],
              'query-vendor': ['@tanstack/react-query'],
              'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-raw', 'rehype-slug', 'rehype-toc'],
              'syntax-vendor': ['react-syntax-highlighter'],
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          }
        }
      }
    };
});
