import React, { useState } from 'react';
import type { Diary } from '../../lib/api';
import {
  useShortDiaryList,
  useCreateDiary,
  useUpdateDiary,
  useDeleteDiary,
} from '../../hooks/queries/diary';
import { Search, Plus, Edit, Trash2, Loader2, X, Save, Quote } from 'lucide-react';

const STAMP_OPTIONS = ['FLOW', 'READ', 'BUG', 'OBSERVE', 'OFFLINE', 'IDEA', 'DONE', 'MEMO'];

const AdminShortDiary: React.FC = () => {
  const { data: diaries = [], isLoading: loading, error: queryError } = useShortDiaryList();
  const createDiary = useCreateDiary();
  const updateDiary = useUpdateDiary();
  const deleteDiary = useDeleteDiary();
  const error = queryError?.message ?? null;
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [formData, setFormData] = useState<Partial<Diary>>({
    type: 'SHORT',
    content: '',
    stamp: 'NOTE',
    tags: []
  });
  const isSubmitting = createDiary.isPending || updateDiary.isPending;

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条短日记吗？')) return;
    try {
      await deleteDiary.mutateAsync(id);
    } catch {
      alert('删除失败');
    }
  };

  const handleEdit = (diary: Diary) => {
    setEditingDiary(diary);
    setFormData({ ...diary });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingDiary(null);
    setFormData({
      type: 'SHORT',
      content: '',
      stamp: 'NOTE',
      tags: []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content?.trim()) {
      alert('请输入日记内容');
      return;
    }

    try {
      if (editingDiary) {
        await updateDiary.mutateAsync({ id: editingDiary.id, data: formData });
      } else {
        await createDiary.mutateAsync({ ...formData, type: 'SHORT' });
      }
      setIsModalOpen(false);
    } catch {
      alert(editingDiary ? '更新失败' : '创建失败');
    }
  };

  const filteredDiaries = diaries.filter(diary => 
    diary.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diary.stamp?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索短日记..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent w-64"
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors"
        >
          <Plus size={20} />
          新建短日记
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-300 font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">总短日记数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{diaries.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">本月新增</p>
              <p className="text-2xl font-bold text-neon">
                {diaries.filter(d => {
                  const date = new Date(d.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">搜索结果</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredDiaries.length}</p>
            </div>
          </div>

          {/* Diaries List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">内容</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">印记</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDiaries.map((diary) => (
                    <tr key={diary.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <Quote size={16} className="text-neon mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2 max-w-md">
                            {diary.content}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neon/10 text-neon border border-neon/20">
                          {diary.stamp || 'NOTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(diary.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(diary)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(diary.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredDiaries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">暂无短日记</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDiary ? '编辑短日记' : '新建短日记'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  内容 *
                </label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="记录此刻的想法..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  印记 (Stamp)
                </label>
                <select
                  value={formData.stamp || 'NOTE'}
                  onChange={(e) => setFormData({ ...formData, stamp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                >
                  {STAMP_OPTIONS.map(stamp => (
                    <option key={stamp} value={stamp}>{stamp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="心情, 编码, 感悟"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingDiary ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShortDiary;
