import React from 'react';
import { api, type HistoryItem } from '../../../lib/api';
import {
  useHistoryItems,
  useCreateHistoryItem,
  useUpdateHistoryItem,
  useDeleteHistoryItem,
} from '../../../hooks/queries/history';
import { Clock, Eye, History, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import { useToastActions } from '../../../contexts/ToastContext';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from '../crud';

const ICON_OPTIONS = ['FileText', 'Briefcase', 'Code', 'Star', 'Trophy', 'Globe', 'Zap', 'Heart'];

const FORM_FIELDS: FieldConfig[] = [
  { key: 'title', label: '标题', type: 'text', colSpan: 2, placeholder: '例如: 个人博客项目' },
  { key: 'date', label: '日期', type: 'text', placeholder: '例如: 2023年6月' },
  { key: 'role', label: '角色', type: 'text', placeholder: '例如: 全栈开发' },
  { key: 'duration', label: '持续时间', type: 'text', placeholder: '例如: 9个月2天' },
  { key: 'location', label: '位置', type: 'text', placeholder: '例如: 远程' },
  { key: 'color', label: '颜色', type: 'color' },
  { key: 'icon', label: '图标', type: 'select', options: ICON_OPTIONS },
  { key: 'isActive', label: '状态', type: 'boolean' },
  { key: 'description', label: '描述', type: 'textarea', rows: 3, colSpan: 2, placeholder: '项目描述...' },
  { key: 'tags', label: '标签', type: 'array', colSpan: 2, placeholder: '项目经历, MongoDB, Node.js, React' },
];

/**
 * 历史项目管理组件
 * 管理前台时间线中显示的历史项目
 */
const AdminHistory: React.FC = () => {
  const toast = useToastActions();
  const { data: items = [], isLoading: loading, error: queryError, refetch } = useHistoryItems();
  const error = queryError?.message ?? null;
  const createItem = useCreateHistoryItem();
  const updateItem = useUpdateHistoryItem();
  const deleteItem = useDeleteHistoryItem();

  const form = useEntityForm<HistoryItem>({
    createMutation: createItem,
    updateMutation: updateItem,
    deleteMutation: deleteItem,
    defaults: { isActive: true, color: '#a855f7', icon: 'FileText', tags: [] },
    validate: (data) => {
      if (!String(data.title ?? '').trim()) return '请填写标题';
      if (!String(data.date ?? '').trim()) return '请填写日期';
      if (!String(data.role ?? '').trim()) return '请填写角色';
      if (!String(data.description ?? '').trim()) return '请填写描述';
      return null;
    },
  });

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const currentItem = items[index];
    const prevItem = items[index - 1];
    try {
      await api.history.reorder(currentItem.id, prevItem.order - 1);
      await refetch();
    } catch (error) {
      toast.error('排序失败');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const currentItem = items[index];
    const nextItem = items[index + 1];
    try {
      await api.history.reorder(currentItem.id, nextItem.order + 1);
      await refetch();
    } catch (error) {
      toast.error('排序失败');
    }
  };

  const stats: StatConfig[] = [
    {
      label: '显示中',
      value: items.filter((item) => item.isActive).length,
      icon: <Eye size={20} />,
      tone: 'orange',
    },
    {
      label: '已隐藏',
      value: items.filter((item) => !item.isActive).length,
      icon: <Clock size={20} />,
      tone: 'gray',
    },
  ];

  return (
    <AdminPageShell
      title="历史项目管理"
      icon={<History size={24} className="text-gray-700 dark:text-white" />}
      accent="orange"
      iconClassName="bg-gradient-to-br from-orange-200/50 to-amber-500/20 dark:from-orange-700/50 dark:to-amber-800/30"
      count={items.length}
      countLabel="个历史项目"
      createLabel="新建历史项目"
      onCreate={form.openCreate}
      loading={loading}
      error={error}
      onRetry={refetch}
      stats={stats}
      isEmpty={items.length === 0}
      emptyEmoji="📚"
      emptyTitle="暂无历史项目"
      emptyActionLabel="创建第一个历史项目"
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`group bg-white dark:bg-gray-800/50 rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${
              item.isActive ? 'border-orange-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700 opacity-70'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: item.color || '#a855f7' }}
                  >
                    {item.icon?.charAt(0) || '📄'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.title}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{item.date}</span>
                      {item.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-amber-900 dark:text-amber-100">
                          显示中
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          隐藏
                        </span>
                      )}
                    </div>
                    <p className="text-orange-600 dark:text-amber-400 text-sm mb-2">{item.role}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-3">
                      <span>⏱️ {item.duration}</span>
                      <span>📍 {item.location}</span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => form.openEdit(item)}
                      className="flex-1 py-2 px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => form.remove(item.id)}
                      className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={form.editingItem ? '编辑历史项目' : '新建历史项目'}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        accent="orange"
        size="md"
      >
        <FormFields fields={FORM_FIELDS} formData={form.formData} onChange={form.setField} accent="orange" />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminHistory;
