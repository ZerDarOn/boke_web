import { useEffect } from 'react';

/**
 * 屏蔽浏览器默认右键菜单，营造"应用化"体验、避免打断自定义光标。
 * 例外：输入框 / 文本域 / 可编辑区域仍保留原生菜单（粘贴、拼写检查等）。
 * 文字选中行为由 index.css 的 user-select 规则控制（正文仍可选+复制）。
 *
 * 如需"完全放开右键"，删除本组件在 App 里的挂载即可；
 * 如需"连输入框也屏蔽"，去掉下面的 isEditable 判断。
 */
const InteractionGuard: React.FC = () => {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const isEditable = !!el?.closest('input, textarea, [contenteditable="true"]');
      if (!isEditable) e.preventDefault();
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, []);

  return null;
};

export default InteractionGuard;
