import React, { useState } from 'react';
import { api } from '../../lib/api';
import { queryKeys } from '../../hooks/api/query-keys';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
  type CrudApi,
} from '../../hooks/queries/admin-resource';
import { Search, Plus, Edit, Trash2, Star, Clock, Eye, Heart, FileText, Calendar, Users, Globe, Code, Network, Loader2, X, Save } from 'lucide-react';

// 导入拆分后的独立组件
import AdminCurrentStatus from './components/AdminCurrentStatus';
import AdminHistory from './components/AdminHistory';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'array';
  options?: string[];
  required?: boolean;
}

interface AdminPageProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  apiEndpoint: string;
  itemKey: string;
  fields?: Field[];
}

const ENDPOINT_CONFIG: Record<string, { rootKey: readonly unknown[]; module: CrudApi<Record<string, unknown>> }> = {
  projects: { rootKey: queryKeys.projects.all, module: api.projects as CrudApi<Record<string, unknown>> },
  diary: { rootKey: queryKeys.diary.all, module: api.diary as CrudApi<Record<string, unknown>> },
  skills: { rootKey: queryKeys.skills.all, module: api.skills as CrudApi<Record<string, unknown>> },
  timeline: { rootKey: queryKeys.timeline.all, module: api.timeline as CrudApi<Record<string, unknown>> },
  network: { rootKey: queryKeys.network.all, module: api.network as CrudApi<Record<string, unknown>> },
  announcements: { rootKey: queryKeys.announcements.all, module: api.announcements as CrudApi<Record<string, unknown>> },
  users: { rootKey: ['users'], module: api.users as CrudApi<Record<string, unknown>> },
};

/**
 * 通用管理页面组件
 * 用于项目、日记、技能、时间线、网络、公告、用户等标准 CRUD 管理页面
 */
const AdminPage: React.FC<AdminPageProps> = ({ 
  title, 
  icon, 
  apiEndpoint,
  itemKey,
  fields = []
}) => {
  const config = ENDPOINT_CONFIG[apiEndpoint];
  const rootKey = config?.rootKey ?? [apiEndpoint];
  const apiModule = config?.module;

  const { data: items = [], isLoading: loading, error: queryError, refetch } = useAdminResourceList(
    rootKey,
    apiModule ?? { getAll: async () => ({ success: false, error: 'API endpoint not found' }) },
  );
  const error = queryError?.message ?? (!apiModule ? 'API endpoint not found' : null);

  const createMutation = useAdminResourceCreate(rootKey, apiModule?.create ?? (async () => ({ success: false, error: 'Not supported' })));
  const updateMutation = useAdminResourceUpdate(rootKey, apiModule?.update ?? (async () => ({ success: false, error: 'Not supported' })));
  const deleteMutation = useAdminResourceDelete(rootKey, apiModule?.delete ?? (async () => ({ success: false, error: 'Not supported' })));

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    if (!apiModule?.delete) {
      alert('删除失败');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
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
    setFormData({ status: 'ACTIVE' });
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
    if (!apiModule) return;
    const submitData = { ...formData };
    if (submitData.featured !== undefined) {
      submitData.featured = submitData.featured === 'true' || submitData.featured === true;
    }
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: submitData });
      } else if (apiModule.create) {
        await createMutation.mutateAsync(submitData);
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
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item[itemKey]?.toLowerCase?.().includes(searchTerm.toLowerCase());
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
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400">共 {items.length} 个{title}</p>
          </div>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-gray-800 to-purple-600 text-white rounded-xl hover:from-gray-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 font-medium">
          <Plus size={18} />新建{title}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-100/50 to-purple-100/30 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">活跃</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-purple-400">{items.filter(item => isActive(item.status)).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-purple-900/30 flex items-center justify-center">
              <Eye size={20} className="text-gray-700 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-100/50 to-orange-100/30 dark:from-yellow-900/20 dark:to-orange-900/10 rounded-xl p-5 border border-yellow-200 dark:border-orange-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">草稿</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-orange-400">{items.filter(item => !isActive(item.status)).length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-200 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock size={20} className="text-yellow-700 dark:text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-100/50 to-cyan-100/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-xl p-5 border border-blue-200 dark:border-cyan-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">总浏览</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-cyan-400">{items.reduce((sum, item) => sum + (item.viewCount || 0), 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-200 dark:bg-cyan-900/30 flex items-center justify-center">
              <Eye size={20} className="text-blue-700 dark:text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-100/50 to-red-100/30 dark:from-pink-900/20 dark:to-red-900/10 rounded-xl p-5 border border-pink-200 dark:border-red-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">总互动</p>
              <p className="text-2xl font-bold text-pink-700 dark:text-red-400">{items.reduce((sum, item) => sum + (item.likeCount || 0), 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-200 dark:bg-red-900/30 flex items-center justify-center">
              <Heart size={20} className="text-pink-700 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={'搜索' + title + '...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFilter('all')} className={'px-4 py-3 rounded-xl transition-colors ' + (filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')}>全部</button>
            <button onClick={() => setFilter('active')} className={'px-4 py-3 rounded-xl transition-colors ' + (filter === 'active' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')}>活跃</button>
            <button onClick={() => setFilter('inactive')} className={'px-4 py-3 rounded-xl transition-colors ' + (filter === 'inactive' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')}>草稿</button>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.title || item.name || item[itemKey]}</h3>
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (isActive(item.status) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300')}>{isActive(item.status) ? '活跃' : '草稿'}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="flex-1 py-2 px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"><Edit size={14} />编辑</button>
                  <button onClick={() => handleDelete(item.id)} className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"><Trash2 size={14} />删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{searchTerm ? '未找到匹配的' : '暂无'}{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{searchTerm ? '尝试其他搜索关键词' : '点击右上角按钮创建第一个' + title}</p>
          <button onClick={handleCreate} className="px-6 py-3 bg-gradient-to-r from-gray-800 to-purple-600 text-white rounded-xl hover:from-gray-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto"><Plus size={18} />新建{title}</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? '编辑' + title : '新建' + title}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} className="text-gray-500 dark:text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 / 名称 <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.title || formData.name || ''} onChange={(e) => handleInputChange(itemKey === 'name' ? 'name' : 'title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="请输入标题" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                  <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="请输入描述" />
                </div>
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder={'请输入' + field.label} />
                    ) : field.type === 'select' ? (
                      <select value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {field.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    ) : field.type === 'array' ? (
                      <input 
                        type="text" 
                        value={Array.isArray(formData[field.key]) ? formData[field.key].join(', ') : (formData[field.key] || '')} 
                        onChange={(e) => handleInputChange(field.key, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                        placeholder={'用逗号分隔多个' + field.label} 
                      />
                    ) : (
                      <input type="text" value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder={'请输入' + field.label} />
                    )}
                  </div>
                ))}
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

// 使用通用 AdminPage 的简单管理组件
const AdminProjects: React.FC = () => <AdminPage title="项目管理" icon={<Code size={24} className="text-gray-700 dark:text-white" />} description="管理所有项目" apiEndpoint="projects" itemKey="name" fields={[{ key: 'name', label: '项目名称', type: 'text', required: true }, { key: 'slug', label: 'URL别名', type: 'text', required: true }, { key: 'type', label: '项目类型', type: 'text', required: true }, { key: 'tech', label: '技术栈', type: 'array' }, { key: 'status', label: '状态', type: 'select', options: ['ACTIVE', 'ARCHIVED', 'DEPLOYED'] }, { key: 'featured', label: '首页展示', type: 'select', options: ['true', 'false'] }, { key: 'githubUrl', label: 'GitHub链接', type: 'text' }, { key: 'demoUrl', label: '演示链接', type: 'text' }]} />;
const AdminDiary: React.FC = () => <AdminPage title="日记管理" icon={<FileText size={24} className="text-gray-700 dark:text-white" />} description="管理日记" apiEndpoint="diary" itemKey="title" fields={[{ key: 'content', label: '内容', type: 'textarea' }, { key: 'mood', label: '心情', type: 'text' }]} />;
const AdminSkills: React.FC = () => <AdminPage title="技能管理" icon={<Star size={24} className="text-gray-700 dark:text-white" />} description="管理技能" apiEndpoint="skills" itemKey="name" fields={[{ key: 'category', label: '分类', type: 'text' }, { key: 'level', label: '等级', type: 'text' }]} />;
const AdminTimeline: React.FC = () => <AdminPage title="时间线管理" icon={<Calendar size={24} className="text-gray-700 dark:text-white" />} description="管理时间线" apiEndpoint="timeline" itemKey="title" fields={[{ key: 'year', label: '年份', type: 'text' }, { key: 'type', label: '类型', type: 'select', options: ['MILESTONE', 'JOB', 'LIFE'] }]} />;
const AdminNetwork: React.FC = () => <AdminPage title="网络管理" icon={<Network size={24} className="text-gray-700 dark:text-white" />} description="管理网络" apiEndpoint="network" itemKey="name" fields={[{ key: 'role', label: '角色', type: 'text' }]} />;
const AdminAnnouncements: React.FC = () => <AdminPage title="公告管理" icon={<Globe size={24} className="text-gray-700 dark:text-white" />} description="管理公告" apiEndpoint="announcements" itemKey="title" fields={[{ key: 'content', label: '内容', type: 'textarea' }]} />;
const AdminUsers: React.FC = () => <AdminPage title="用户管理" icon={<Users size={24} className="text-gray-700 dark:text-white" />} description="管理用户" apiEndpoint="users" itemKey="username" />;

// 导出所有组件
export { 
  AdminProjects, 
  AdminDiary, 
  AdminSkills, 
  AdminTimeline, 
  AdminNetwork, 
  AdminAnnouncements, 
  AdminUsers, 
  AdminCurrentStatus, 
  AdminHistory 
};
