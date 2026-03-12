import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Plus, Edit, Trash2, Star, Clock, Eye, Heart, FileText, Calendar, Users, Globe, Code, Network, Loader2, X, Save, Radio, History, ArrowUp, ArrowDown } from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
}

interface AdminPageProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  apiEndpoint: string;
  itemKey: string;
  fields?: Field[]; 
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  title, 
  icon, 
  apiEndpoint,
  itemKey,
  fields = []
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter === 'active';
      }
      const apiModule = (api as any)[apiEndpoint];
      if (!apiModule) {
        setError('API endpoint not found');
        setLoading(false);
        return;
      }
      const result = await apiModule.getAll(params);
      if (result.success && result.data) {
        setItems(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      const apiModule = (api as any)[apiEndpoint];
      if (apiModule && apiModule.delete) {
        await apiModule.delete(id);
        setItems(items.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
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
    setFormData({ status: 'active' });
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
      const apiModule = (api as any)[apiEndpoint];
      if (!apiModule) return;
      if (editingItem) {
        await apiModule.update(editingItem.id, formData);
      } else {
        await apiModule.create(formData);
      }
      await fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item[itemKey]?.toLowerCase?.().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-2xl font-bold text-gray-900 dark:text-purple-400">{items.filter(item => item.status === 'active').length}</p>
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
              <p className="text-2xl font-bold text-yellow-700 dark:text-orange-400">{items.filter(item => item.status === 'inactive').length}</p>
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
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300')}>{item.status === 'active' ? '活跃' : '草稿'}</span>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 / 名称</label>
                  <input type="text" value={formData.title || formData.name || ''} onChange={(e) => handleInputChange(itemKey === 'name' ? 'name' : 'title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="请输入标题" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                  <select value={formData.status || 'active'} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="active">活跃</option>
                    <option value="inactive">草稿</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                  <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="请输入描述" />
                </div>
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder={'请输入' + field.label} />
                    ) : field.type === 'select' ? (
                      <select value={formData[field.key] || ''} onChange={(e) => handleInputChange(field.key, e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {field.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
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

const AdminProjects: React.FC = () => <AdminPage title="项目管理" icon={<Code size={24} className="text-gray-700 dark:text-white" />} description="管理所有项目" apiEndpoint="projects" itemKey="name" fields={[{ key: 'tech', label: '技术栈', type: 'text' }, { key: 'githubUrl', label: 'GitHub链接', type: 'text' }, { key: 'demoUrl', label: '演示链接', type: 'text' }]} />;
const AdminDiary: React.FC = () => <AdminPage title="日记管理" icon={<FileText size={24} className="text-gray-700 dark:text-white" />} description="管理日记" apiEndpoint="diary" itemKey="title" fields={[{ key: 'content', label: '内容', type: 'textarea' }, { key: 'mood', label: '心情', type: 'text' }]} />;
const AdminSkills: React.FC = () => <AdminPage title="技能管理" icon={<Star size={24} className="text-gray-700 dark:text-white" />} description="管理技能" apiEndpoint="skills" itemKey="name" fields={[{ key: 'category', label: '分类', type: 'text' }, { key: 'level', label: '等级', type: 'text' }]} />;
const AdminTimeline: React.FC = () => <AdminPage title="时间线管理" icon={<Calendar size={24} className="text-gray-700 dark:text-white" />} description="管理时间线" apiEndpoint="timeline" itemKey="title" fields={[{ key: 'year', label: '年份', type: 'text' }, { key: 'type', label: '类型', type: 'select', options: ['MILESTONE', 'JOB', 'LIFE'] }]} />;
const AdminNetwork: React.FC = () => <AdminPage title="网络管理" icon={<Network size={24} className="text-gray-700 dark:text-white" />} description="管理网络" apiEndpoint="network" itemKey="name" fields={[{ key: 'role', label: '角色', type: 'text' }]} />;
const AdminAnnouncements: React.FC = () => <AdminPage title="公告管理" icon={<Globe size={24} className="text-gray-700 dark:text-white" />} description="管理公告" apiEndpoint="announcements" itemKey="title" fields={[{ key: 'content', label: '内容', type: 'textarea' }]} />;
const AdminUsers: React.FC = () => <AdminPage title="用户管理" icon={<Users size={24} className="text-gray-700 dark:text-white" />} description="管理用户" apiEndpoint="users" itemKey="username" />;

// 当前状态管理 (CurrentStatus)
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

// 历史项目管理 (HistoryItem)
const AdminHistory: React.FC = () => {
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
      const result = await api.history.getAll();
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
      await api.history.delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      alert('删除失败');
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
    try {
      setIsSubmitting(true);
      
      // 验证必填字段
      if (!formData.title?.trim()) {
        alert('请填写标题');
        setIsSubmitting(false);
        return;
      }
      if (!formData.date?.trim()) {
        alert('请填写日期');
        setIsSubmitting(false);
        return;
      }
      if (!formData.role?.trim()) {
        alert('请填写角色');
        setIsSubmitting(false);
        return;
      }
      if (!formData.description?.trim()) {
        alert('请填写描述');
        setIsSubmitting(false);
        return;
      }
      
      const submitData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      };
      if (editingItem) {
        await api.history.update(editingItem.id, submitData);
      } else {
        await api.history.create(submitData);
      }
      await fetchItems();
      handleCloseModal();
    } catch (error) {
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const currentItem = items[index];
    const prevItem = items[index - 1];
    try {
      await api.history.reorder(currentItem.id, prevItem.order - 1);
      await fetchItems();
    } catch (error) {
      alert('排序失败');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;
    const currentItem = items[index];
    const nextItem = items[index + 1];
    try {
      await api.history.reorder(currentItem.id, nextItem.order + 1);
      await fetchItems();
    } catch (error) {
      alert('排序失败');
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
        <button onClick={fetchItems} className="mt-2 text-sm text-red-600 dark:text-red-300 underline">重试</button>
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

export { AdminProjects, AdminDiary, AdminSkills, AdminTimeline, AdminNetwork, AdminAnnouncements, AdminUsers, AdminCurrentStatus, AdminHistory };
