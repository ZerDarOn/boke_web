import { Loader2 } from 'lucide-react';

/**
 * 公共页数据状态组件：收敛各页面重复的 loading / error 脚手架。
 * Loader 视觉与既有实现一致（neon 色 Loader2 居中），
 * 容器高度通过 className 适配各页原有布局。
 */
export function PageLoader({
  className = 'min-h-96',
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-neon" size={size} />
    </div>
  );
}

/**
 * 数据加载失败横幅。error 为空时返回 null，可直接内联在 JSX 中。
 */
export function ErrorBanner({
  error,
  className = '',
}: {
  error: unknown;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
    >
      <p className="text-red-600 dark:text-red-300 font-mono text-sm">
        ERROR: {String(error)}
      </p>
    </div>
  );
}
