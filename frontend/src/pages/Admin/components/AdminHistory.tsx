import React, { useState } from 'react';
import { api, type HistoryItem } from '../../../lib/api';
import {
  useHistoryItems,
  useCreateHistoryItem,
  useUpdateHistoryItem,
  useDeleteHistoryItem,
} from '../../../hooks/queries/history';
import { Plus, Edit, Trash2, Clock, Eye, Loader2, X, Save, History, ArrowUp, ArrowDown } from 'lucide-react';
import { useToastActions } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';

/**
 * 历史项目管理组件
 * 管理前台时间线中显示的历史项目
 */
const AdminHistory: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const { data: items = [], isLoading: loading, error: queryError, refetch } = useHistoryItems();
  const error = queryError?.message ?? null;
  const createItem = useCreateHistoryItem();
  const updateItem = useUpdateHistoryItem();
  const deleteItem = useDeleteHistoryItem();

  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  type HistoryForm = Omit<Partial<HistoryItem>, 'tags'> & { tags?: string | string[] };
  const [formData, setFormData] = useState<HistoryForm>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSubmitting = createItem.isPending || updateItem.isPending;

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '确定要删除吗？' }))) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success('删除成功');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ 
      ...item,
      tags: item.tags ? item.tags.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ isActive: true, color: '#a855f7', icon: 'FileText', tags: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!String(formData.title ?? '').trim()) {
      toast.warning('请填写标题');
      return;
    }
    if (!String(formData.date ?? '').trim()) {
      toast.warning('请填写日期');
      return;
    }
    if (!String(formData.role ?? '').trim()) {
      toast.warning('请填写角色');
      return;
    }
    if (!String(formData.description ?? '').trim()) {
      toast.warning('请填写描述');
      return;
    }

    const tagsRaw = formData.tags;
    const submitData: Partial<HistoryItem> = {
      ...formData,
      tags:
        typeof tagsRaw === 'string'
          ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
          : Array.isArray(tagsRaw)
            ? tagsRaw.map(String)
            : [],
    };

    try {
      if (editingItem?.id) {
        await updateItem.mutateAsync({ id: String(editingItem.id), data: submitData });
      } else {
        await createItem.mutateAsync(submitData);
      }
      handleCloseModal();
      toast.success(editingItem?.id ? '更新成功' : '创建成功');
    } catch {
      toast.error('保存失败');
    }
  };

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

  const iconOptions = ['FileText', 'Briefcase', 'Code', 'Star', 'Trophy', 'Globe', 'Zap', 'Heart'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-500" size={32} />
          <p className="text-gray-600 dark:text-gray-300 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 font-mono text-sm">ERROR: {error}</p>
        <button onClick={() => refetch()} className="mt-2 text-sm text-red-600 dark:text-red-300 underline">重试</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200/50 to-amber-500/20 dark:from-orange-700/50 dark:to-amber-800/30 flex items-center justify-center">
            <History size={24} className="text-gray-700 dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">历史项目管理</h1>
            <p className="text-gray-600 dark:text-gray-400">共 {items.length} 个历史项目</p>
          </div>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg flex items-center gap-2 font-medium">
          <Plus size={18} />新建历史项目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-100/50 to-amber-100/30 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-5 border border-orange-200 dark:border-amber-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">显示中</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-amber-400">{items.filter(item => item.isActive).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-200 dark:bg-amber-900/30 flex items-center justify-center">
              <Eye size={20} className="text-orange-700 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-100/50 to-slate-100/30 dark:from-gray-800/50 dark:to-slate-900/20 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">已隐藏</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{items.filter(item => !item.isActive).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
              <Clock size={20} className="text-gray-700 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className={`group bg-white dark:bg-gray-800/50 rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${item.isActive ? 'border-orange-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700 opacity-70'}`}>
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
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-amber-900 dark:text-amber-100">显示中</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">隐藏</span>
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
                            <span key={i} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{tag}</span>
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
                      <button onClick={() => handleEdit(item)} className="flex-1 py-2 px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">暂无历史项目</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">点击右上角按钮创建第一个历史项目</p>
          <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto">
            <Plus size={18} />新建历史项目
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? '编辑历史项目' : '新建历史项目'}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 个人博客项目" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">日期</label>
                  <input type="text" value={formData.date || ''} onChange={(e) => handleInputChange('date', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 2023年6月" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
                  <input type="text" value={formData.role || ''} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 全栈开发" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">持续时间</label>
                  <input type="text" value={formData.duration || ''} onChange={(e) => handleInputChange('duration', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 9个月2天" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">位置</label>
                  <input type="text" value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 远程" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">颜色</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.color || '#a855f7'} onChange={(e) => handleInputChange('color', e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600" />
                    <input type="text" value={formData.color || ''} onChange={(e) => handleInputChange('color', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="#a855f7" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标</label>
                  <select value={formData.icon || 'FileText'} onChange={(e) => handleInputChange('icon', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                  <select value={formData.isActive ? 'true' : 'false'} onChange={(e) => handleInputChange('isActive', e.target.value === 'true')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="true">显示</option>
                    <option value="false">隐藏</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                  <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="项目描述..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签 (用逗号分隔)</label>
                  <input type="text" value={formData.tags || ''} onChange={(e) => handleInputChange('tags', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="项目经历, MongoDB, Node.js, React" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? (<><Loader2 size={16} className="animate-spin" />保存中...</>) : (<><Save size={16} />保存</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
