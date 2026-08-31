import React from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { CrudAccent } from './types';

const SAVE_CLASSES: Record<CrudAccent, string> = {
  purple: 'bg-purple-600 hover:bg-purple-700',
  cyan: 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
};

/** 统一的编辑/新建弹窗外壳（头部 + 滚动区 + 保存底栏） */
export const AdminEntityModal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  accent?: CrudAccent;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}> = ({ open, title, onClose, onSubmit, submitting, accent = 'purple', size = 'md', children }) => {
  if (!open) return null;
  const width = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-3xl' : size === 'md' ? 'max-w-2xl' : 'max-w-xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">{children}</div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={`px-4 py-2 ${SAVE_CLASSES[accent]} text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50`}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
