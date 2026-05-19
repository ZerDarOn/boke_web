import React, { useState, useMemo } from 'react';
import type { Project } from '../../lib/api';
import {
  useProjectsList,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/queries/projects';
import { Search, Plus, Edit, Trash2, Code, Loader2, X, Save, LayoutGrid, FileText, Rocket, Archive, CheckCircle2 } from 'lucide-react';

const AdminProjectsPage: React.FC = () => {
  const { data: items = [], isLoading: loading, error: queryError, refetch } = useProjectsList({ limit: 500 });
  const error = queryError?.message ?? null;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSubmitting = createProject.isPending || updateProject.isPending;
  const [editMode, setEditMode] = useState<'card' | 'detail'>('card');

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await deleteProject.mutateAsync(id);
    } catch {
      alert('删除失败');
    }
  };

  const handleEdit = (item: Project) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ status: 'ACTIVE', featured: false });
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
    const submitData = { ...formData };
    if (submitData.featured !== undefined) {
      submitData.featured = submitData.featured === 'true' || submitData.featured === true;
    }
    try {
      if (editingItem) {
        await updateProject.mutateAsync({ id: editingItem.id, data: submitData });
      } else {
        await createProject.mutateAsync(submitData);
      }
      handleCloseModal();
    } catch {
      alert('保存失败');
    }
  };

  const isActive = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'active' || s === 'published';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'active') return isActive(item.status);
    return !isActive(item.status);
  });

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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200/50 to-purple-500/20 dark:from-gray-700/50 dark:to-purple-800/30 flex items-center justify-center">
            <Code size={24} className="text-gray-700 dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">项目管理</h1>
            <p className="text-gray-600 dark:text-gray-400">共 {items.length} 个项目</p>
          </div>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-purple-600 text-white rounded-xl hover:from-gray-700 hover:to-purple-700 transition-all shadow-lg">
          <Plus size={18} />新建项目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">活跃项目</p>
              <p className="text-3xl font-bold">{items.filter(i => i.status === 'ACTIVE').length}</p>
            </div>
            <Rocket size={32} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">已部署</p>
              <p className="text-3xl font-bold">{items.filter(i => i.status === 'DEPLOYED').length}</p>
            </div>
            <CheckCircle2 size={32} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">已归档</p>
              <p className="text-3xl font-bold">{items.filter(i => i.status === 'ARCHIVED').length}</p>
            </div>
            <Archive size={32} className="text-gray-200" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            活跃
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'inactive' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            草稿
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">编辑模式:</span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setEditMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editMode === 'card' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <LayoutGrid size={14} />
              卡片
            </button>
            <button
              onClick={() => setEditMode('detail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editMode === 'detail' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <FileText size={14} />
              详情
            </button>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.name}</h3>
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (isActive(item.status) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300')}>{isActive(item.status) ? '活跃' : '草稿'}</span>
                </div>
                {editMode === 'detail' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.readme ? '✓ 有详细文档' : '✗ 暂无详细文档'}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="flex-1 py-2 px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                    <Edit size={14} />{editMode === 'card' ? '编辑' : '编辑详情'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{searchTerm ? '未找到匹配的' : '暂无'}项目</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{searchTerm ? '尝试其他搜索关键词' : '点击右上角按钮创建第一个项目'}</p>
          <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-gray-800 to-purple-600 text-white rounded-xl hover:from-gray-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto"><Plus size={18} />新建项目</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden ${editMode === 'detail' ? 'max-w-4xl' : 'max-w-2xl'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? '编辑' : '新建'}项目{editMode === 'detail' ? '详情' : ''}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {editMode === 'card' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目名称 <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="请输入项目名称" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL别名 <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.slug || ''} onChange={(e) => handleInputChange('slug', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="url-slug" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目类型 <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.type || ''} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="BLOG SYSTEM" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">技术栈</label>
                        <input type="text" value={Array.isArray(formData.tech) ? formData.tech.join(', ') : (formData.tech || '')} onChange={(e) => handleInputChange('tech', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="React, TypeScript, Node.js" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                        <select value={formData.status || 'ACTIVE'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="DEPLOYED">DEPLOYED</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">首页展示</label>
                        <select value={formData.featured ? 'true' : 'false'} onChange={(e) => handleInputChange('featured', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option value="true">是</option>
                          <option value="false">否</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub链接</label>
                        <input type="text" value={formData.githubUrl || ''} onChange={(e) => handleInputChange('githubUrl', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">演示链接</label>
                        <input type="text" value={formData.demoUrl || ''} onChange={(e) => handleInputChange('demoUrl', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目链接</label>
                      <input type="text" value={formData.link || ''} onChange={(e) => handleInputChange('link', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目截图</label>
                      <input type="text" value={formData.imageUrl || ''} onChange={(e) => handleInputChange('imageUrl', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="图片URL或CSS渐变" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">简介</label>
                      <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="项目简介..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        💡 详情模式用于编辑完整的 README 文档内容，支持 Markdown 格式
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目名称</label>
                        <input type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" disabled />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                        <select value={formData.status || 'ACTIVE'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="DEPLOYED">DEPLOYED</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">简介描述</label>
                      <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="项目简介（显示在详情页顶部）..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">README 文档 <span className="text-gray-400 font-normal">(支持 Markdown)</span></label>
                      <textarea value={formData.readme || ''} onChange={(e) => handleInputChange('readme', e.target.value)} rows={20} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm" placeholder="# 项目名称&#10;&#10;项目描述...&#10;&#10;## 功能特性&#10;&#10;- 功能1&#10;- 功能2" />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? (<><Loader2 size={16} className="animate-spin" />保存中...</>) : (<><Save size={16} />保存</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPage;
