import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Plus, Edit, Trash2, Clock, Loader2, X, Save, Radio } from 'lucide-react';

/**
 * 当前状态管理组件
 * 管理前台时间线中显示的当前状态
 */
const AdminCurrentStatus: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.currentStatus.getAll();
      if (result.success && result.data) {
        setItems(result.data);
      } else {
        setError(result.error || '获取失败');
      }
    } catch (err) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.currentStatus.delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ isActive: true, emoji: '💻' });
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
    try {
      setIsSubmitting(true);
      if (editingItem) {
        await api.currentStatus.update(editingItem.id, formData);
      } else {
        await api.currentStatus.create(formData);
      }
      await fetchItems();
      handleCloseModal();
    } catch (error) {
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.currentStatus.activate(id);
      await fetchItems();
    } catch (error) {
      alert('激活失败');
    }
  };

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
        <button onClick={fetchItems} className="mt-2 text-sm text-red-600 dark:text-red-300 underline">重试</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-200/50 to-emerald-500/20 dark:from-green-700/50 dark:to-emerald-800/30 flex items-center justify-center">
            <Radio size={24} className="text-gray-700 dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">当前状态管理</h1>
            <p className="text-gray-600 dark:text-gray-400">共 {items.length} 个状态配置</p>
          </div>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg flex items-center gap-2 font-medium">
          <Plus size={18} />新建状态
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-100/50 to-emerald-100/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-5 border border-green-200 dark:border-emerald-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">活跃状态</p>
              <p className="text-2xl font-bold text-green-700 dark:text-emerald-400">{items.filter(item => item.isActive).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-200 dark:bg-emerald-900/30 flex items-center justify-center">
              <Radio size={20} className="text-green-700 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-100/50 to-slate-100/30 dark:from-gray-800/50 dark:to-slate-900/20 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">备用状态</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{items.filter(item => !item.isActive).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
              <Clock size={20} className="text-gray-700 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className={`group rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${item.isActive ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.emoji || '💻'}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.currentFocus}</p>
                    </div>
                  </div>
                  {item.isActive ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1">
                      <Radio size={10} className="animate-pulse" /> 使用中
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">备用</span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p><span className="text-gray-400">位置:</span> {item.location}</p>
                  <p><span className="text-gray-400">Vibe:</span> {item.vibe}</p>
                </div>
                <div className="flex gap-2">
                  {!item.isActive && (
                    <button onClick={() => handleActivate(item.id)} className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                      <Radio size={14} />启用
                    </button>
                  )}
                  <button onClick={() => handleEdit(item)} className={`py-2 px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 ${item.isActive ? 'flex-1' : ''}`}>
                    <Edit size={14} />编辑
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">暂无状态配置</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">点击右上角按钮创建第一个状态</p>
          <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto">
            <Plus size={18} />新建状态
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? '编辑状态' : '新建状态'}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                  <input type="text" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: BUILDING THE FUTURE" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">当前专注</label>
                  <input type="text" value={formData.currentFocus || ''} onChange={(e) => handleInputChange('currentFocus', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: Learning Next.js & Rust" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">位置</label>
                  <input type="text" value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: Neo-City, Sector 7" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vibe</label>
                  <input type="text" value={formData.vibe || ''} onChange={(e) => handleInputChange('vibe', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 💻 Coding / ☕ Coffee" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
                  <input type="text" value={formData.emoji || ''} onChange={(e) => handleInputChange('emoji', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="例如: 💻" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                  <select value={formData.isActive ? 'true' : 'false'} onChange={(e) => handleInputChange('isActive', e.target.value === 'true')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="true">活跃</option>
                    <option value="false">备用</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? (<><Loader2 size={16} className="animate-spin" />保存中...</>) : (<><Save size={16} />保存</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurrentStatus;
