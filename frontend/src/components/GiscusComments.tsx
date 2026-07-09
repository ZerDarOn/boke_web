import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface GiscusCommentsProps {
  theme?: 'light' | 'dark';
}

/**
 * Giscus 评论组件
 *
 * 基于 GitHub Discussions，利用 giscus.app 提供的轻量脚本接入。
 * 使用前需要在 GitHub 仓库中：
 *  1. 开启 Discussions 功能
 *  2. 安装 giscus GitHub App (https://github.com/apps/giscus)
 *  3. 前往 https://giscus.app 填写仓库信息，获取 repo / repoId / categoryId
 *
 * 配置项通过顶部常量集中管理，保持代码整洁。
 */

// ── 配置（替换为你自己的仓库信息） ──
const GISCUS_CONFIG = {
  repo: 'ZerDarOn/boke_web' as `${string}/${string}`,
  repoId: 'R_kgDORL1jBQ',
  categoryId: 'DIC_kwDORL1jBc4DAz87',
  category: 'Announcements',
  mapping: 'pathname' as const,
  reactionsEnabled: '1' as const,
  emitMetadata: '0' as const,
  inputPosition: 'bottom' as const,
  lang: 'zh-CN',
  loading: 'lazy' as const,
};

const GiscusComments: React.FC<GiscusCommentsProps> = ({ theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [configured, setConfigured] = useState(
    Boolean(GISCUS_CONFIG.repoId && GISCUS_CONFIG.categoryId),
  );
  const location = useLocation();

  // 每次路由变化时，Giscus 通过 iframe postMessage 自动重载对应 Discussion
  // 我们只需保证脚本只注入一次，且 script 的 src 随 theme 更新
  useEffect(() => {
    if (!configured) return;

    const container = containerRef.current;
    if (!container) return;

    // 清空旧 iframe（主题切换时重建）
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', GISCUS_CONFIG.repo);
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
    script.setAttribute('data-category', GISCUS_CONFIG.category);
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled);
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata);
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
    script.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark_dimmed');
    script.setAttribute('data-lang', GISCUS_CONFIG.lang);
    script.setAttribute('data-loading', GISCUS_CONFIG.loading);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
  }, [configured, theme, location.pathname]);

  // 未配置时显示引导
  if (!configured) {
    return (
      <div className="w-full mt-12">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-8">
          <h3 className="text-lg font-semibold text-ink dark:text-white mb-3">评论功能</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Giscus 评论系统尚未配置。需要前往{' '}
            <a
              href="https://giscus.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon underline"
            >
              giscus.app
            </a>{' '}
            获取 <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-xs">repoId</code> 和{' '}
            <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-xs">categoryId</code>，
            填入 <code className="bg-gray-100 dark:bg-white/10 px-1 rounded text-xs">GiscusComments.tsx</code> 顶部的
            GISCUS_CONFIG 即可启用。
          </p>
          <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1">
            <li>确保 GitHub 仓库已开启 Discussions</li>
            <li>安装 <a href="https://github.com/apps/giscus" target="_blank" rel="noopener noreferrer" className="text-neon underline">giscus GitHub App</a></li>
            <li>在 giscus.app 填写仓库信息并复制 ID</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-12">
      <div
        ref={containerRef}
        className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
      />
    </div>
  );
};

export default GiscusComments;
