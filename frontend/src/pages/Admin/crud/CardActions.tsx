import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { CrudAccent } from './types';

const EDIT_CLASSES: Record<CrudAccent, string> = {
  purple: 'bg-gray-800 hover:bg-gray-700',
  cyan: 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700',
  orange: 'bg-gray-800 hover:bg-gray-700',
};

/** 列表卡片底部的 编辑/删除 操作对；label 省略时渲染为图标按钮 */
export const CardActions: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  accent?: CrudAccent;
  /** 覆盖编辑按钮配色（如 bg-purple-600 hover:bg-purple-700） */
  editClassName?: string;
}> = ({ onEdit, onDelete, editLabel, deleteLabel, accent = 'purple', editClassName }) => (
  <div className="mt-4 flex gap-2">
    <button
      onClick={onEdit}
      className={`flex-1 py-2 px-3 ${editClassName ?? EDIT_CLASSES[accent]} text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5`}
    >
      <Edit size={14} />
      {editLabel}
    </button>
    <button
      onClick={onDelete}
      className={
        deleteLabel
          ? 'py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5'
          : 'py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center'
      }
    >
      <Trash2 size={14} />
      {deleteLabel}
    </button>
  </div>
);
