import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Plus, Edit, Trash2, Star, Filter, Clock, Eye, Heart, FileText, Camera, Calendar, Users, Settings, Globe, Link, Code, Palette, Network, Loader2, X, Save } from 'lucide-react';

interface AdminPageProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  apiEndpoint?: string;
  itemKey: string;
  itemTitle?: string;
  itemStatus?: string;
  itemStats?: { icon: React.ReactNode; value: string }[];
  fields?: { key: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  title, 
  icon, 
  description, 
  apiEndpoint,
  itemKey,
  itemStats,
  fields = []
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (apiEndpoint) {
      fetchItems();
    }
  }, [filter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter === 'active';
      }
      const result = await api[apiEndpoint].getAll(params);
      if (result.success && result.data) {
        setItems(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error(`Failed to fetch ${title}:`, error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`确定要删除该${title}吗？`)) return;
    
    try {
      await api[apiEndpoint].delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Failed to delete ${title}:`, error);
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
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiEndpoint) return;
    
    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update
        const result = await api[apiEndpoint].update(editingItem.id, formData);
        if (result.success) {
          setItems(items.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
          handleCloseModal();
        } else {
          alert('更新失败: ' + result.error);
        }
      } else {
        // Create
        const result = await api[apiEndpoint].create(formData);
        if (result.success && result.data) {
          setItems([result.data, ...items]);
          handleCloseModal();
        } else {
          alert('创建失败: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item[itemKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 font-mono text-sm">
          ERROR: {error}
        </p>
        <button
          onClick={fetchItems}
          className="mt-2 text-sm text-red-600 dark:text-red-300 underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink/20 to-purple-500/20 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-paper">{title}</h1>
            <p className="text-ink/70 dark:text-gray-400">共 {items.length} 个{title}</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          新建{title}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-ink/10 to-purple-600/5 dark:from-ink/20 dark:to-purple-800/10 rounded-xl p-5 border border-ink/10 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">活跃</p>
              <p className="text-2xl font-bold text-ink dark:text-purple-400">
                {items.filter(item => item.status === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-ink/10 dark:bg-purple-900/30 flex items-center justify-center">
              <Eye size={20} className="text-ink dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/5 dark:from-yellow-900/20 dark:to-orange-800/10 rounded-xl p-5 border border-yellow-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">草稿/未发布</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-orange-400">
                {items.filter(item => item.status === 'draft' || item.status === 'inactive').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 dark:from-blue-900/20 dark:to-cyan-800/10 rounded-xl p-5 border border-blue-200 dark:border-cyan-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">总浏览</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-cyan-400">
                {items.reduce((sum, item) => sum + (item.viewCount || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Eye size={20} className="text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/10 to-red-600/5 dark:from-pink-900/20 dark:to-red-800/10 rounded-xl p-5 border border-pink-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">总互动</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-red-400">
                {items.reduce((sum, item) => sum + (item.likeCount || 0), 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-red-900/30 flex items-center justify-center">
              <Heart size={20} className="text-pink-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-black/30 rounded-xl p-5 border border-ink/10 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-gray-500" />
            <input
              type="text"
              placeholder={`搜索${title}标题或${itemKey}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-ink/50 focus:border-ink/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'all'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'active'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                活跃
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'inactive'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                草稿
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? `编辑${title}` : `新建${title}`}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Default fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题 / 名称
                  </label>
                  <input
                    type="text"
                    value={formData.title || formData.name || ''}
                    onChange={(e) => handleInputChange(itemKey === 'name' ? 'name' : 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    状态
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">草稿</option>
                  </select>
                </div>

                {/* Description field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入描述"
                  />
                </div>

                {/* Custom fields based on entity type */}
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`请输入${field.label}`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`请输入${field.label}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
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
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-ink dark:text-paper text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {item.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-ink/20 dark:bg-gray-800 text-ink dark:text-gray-300'
                  }`}>
                    {item.status === 'active' ? '活跃' : '草稿'}
                  </span>
                </div>

                {/* Stats */}
                {itemStats && itemStats.length > 0 && (
                  <div className="space-y-2 text-sm mb-4">
                    {itemStats.map((stat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-ink/70 dark:text-gray-400">
                        {stat.icon && <span className="text-ink/40 dark:text-gray-500">{stat.icon}</span>}
                        <span>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="flex-1 py-2 px-3 bg-ink text-white rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-black/30 rounded-xl p-16 text-center border border-ink/10 dark:border-gray-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">
            {searchTerm ? '未找到匹配的' : '暂无'}{title}
          </h3>
          <p className="text-ink/70 dark:text-gray-400 mb-6">
            {searchTerm ? '尝试其他搜索关键词' : `点击右上角按钮创建第一个${title}`}
          </p>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium mx-auto"
          >
            <Plus size={18} />
            新建{title}
          </button>
        </div>
      )}
    </div>
  );
};

const AdminProjects: React.FC = () => (
  <AdminPage
    title="项目管理"
    icon={<Code size={24} className="text-ink dark:text-paper" />}
    description="管理所有项目，包括技术栈、链接和部署状态"
    apiEndpoint="projects"
    itemKey="name"
    itemStats={[
      { icon: <Star size={14} />, value: "⭐ 评分" },
      { icon: <Link size={14} />, value: "🔗 链接" },
    ]}
    fields={[
      { key: 'tech', label: '技术栈', type: 'text' },
      { key: 'githubUrl', label: 'GitHub链接', type: 'text' },
      { key: 'demoUrl', label: '演示链接', type: 'text' },
      { key: 'type', label: '项目类型', type: 'select', options: ['Web应用', '移动应用', '工具库', '其他'] },
    ]}
  />
);

const AdminGallery: React.FC = () => (
  <AdminPage
    title="相册管理"
    icon={<Camera size={24} className="text-ink dark:text-paper" />}
    description="管理相册和照片，支持批量操作和 EXIF 信息查看"
    apiEndpoint="gallery"
    itemKey="name"
    itemStats={[
      { icon: <Eye size={14} />, value: "👁️ 浏览" },
      { icon: <Palette size={14} />, value: "🎨 编辑" },
    ]}
  />
);

const AdminDiary: React.FC = () => (
  <AdminPage
    title="日记管理"
    icon={<FileText size={24} className="text-ink dark:text-paper" />}
    description="管理便签和长文日记，支持 Markdown 编辑"
    apiEndpoint="diary"
    itemKey="title"
    itemStats={[
      { icon: <Calendar size={14} />, value: "📅 日期" },
      { icon: <Clock size={14} />, value: "⏰ 时间" },
    ]}
    fields={[
      { key: 'content', label: '内容', type: 'textarea' },
      { key: 'mood', label: '心情', type: 'text' },
      { key: 'weather', label: '天气', type: 'text' },
      { key: 'location', label: '地点', type: 'text' },
    ]}
  />
);

const AdminSkills: React.FC = () => (
  <AdminPage
    title="技能管理"
    icon={<Star size={24} className="text-ink dark:text-paper" />}
    description="管理技能矩阵，包括等级、项目和可视化节点"
    apiEndpoint="skills"
    itemKey="name"
    itemStats={[
      { icon: <Star size={14} />, value: "⭐ 等级" },
      { icon: <Users size={14} />, value: "👥 项目" },
    ]}
    fields={[
      { key: 'category', label: '分类', type: 'text' },
      { key: 'level', label: '等级 (1-5)', type: 'text' },
      { key: 'rank', label: '排名', type: 'text' },
    ]}
  />
);

const AdminTimeline: React.FC = () => (
  <AdminPage
    title="时间线管理"
    icon={<Calendar size={24} className="text-ink dark:text-paper" />}
    description="管理时间线事件，包括里程碑、工作和生活事件"
    apiEndpoint="timeline"
    itemKey="title"
    itemStats={[
      { icon: <Clock size={14} />, value: "⏰ 时间" },
      { icon: <Calendar size={14} />, value: "📅 日期" },
    ]}
    fields={[
      { key: 'year', label: '年份', type: 'text' },
      { key: 'date', label: '日期', type: 'text' },
      { key: 'type', label: '类型', type: 'select', options: ['MILESTONE', 'JOB', 'LIFE'] },
    ]}
  />
);

const AdminNetwork: React.FC = () => (
  <AdminPage
    title="网络管理"
    icon={<Network size={24} className="text-ink dark:text-paper" />}
    description="管理关系网络节点，可视化人脉和合作网络"
    apiEndpoint="network"
    itemKey="name"
    itemStats={[
      { icon: <Link size={14} />, value: "🔗 连接" },
      { icon: <Users size={14} />, value: "👥 节点" },
    ]}
    fields={[
      { key: 'role', label: '角色', type: 'text' },
      { key: 'type', label: '节点类型', type: 'select', options: ['core', 'major', 'minor'] },
    ]}
  />
);

const AdminAnnouncements: React.FC = () => (
  <AdminPage
    title="公告管理"
    icon={<Globe size={24} className="text-ink dark:text-paper" />}
    description="管理系统公告，支持多种类型和附件"
    apiEndpoint="announcements"
    itemKey="title"
    itemStats={[
      { icon: <Eye size={14} />, value: "👁️ 查看" },
      { icon: <Clock size={14} />, value: "⏰ 时间" },
    ]}
    fields={[
      { key: 'content', label: '内容', type: 'textarea' },
      { key: 'type', label: '类型', type: 'select', options: ['INFO', 'WARNING', 'SUCCESS', 'IMPORTANT'] },
    ]}
  />
);

const AdminUsers: React.FC = () => (
  <AdminPage
    title="用户管理"
    icon={<Users size={24} className="text-ink dark:text-paper" />}
    description="管理系统用户，包括权限、角色和状态"
    apiEndpoint="users"
    itemKey="username"
    itemStats={[
      { icon: <Settings size={14} />, value: "⚙️ 权限" },
      { icon: <Clock size={14} />, value: "⏰ 最后登录" },
    ]}
  />
);

const AdminSettings: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink/20 to-purple-500/20 flex items-center justify-center">
          <Settings size={24} className="text-ink dark:text-paper" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-paper">系统设置</h1>
          <p className="text-ink/70 dark:text-gray-400">配置系统全局参数和功能开关</p>
        </div>
      </div>
    </div>

    {/* Settings Content */}
    <div className="bg-white dark:bg-black/30 rounded-xl p-6 border border-ink/10 dark:border-gray-700">
      <p className="text-ink/70 dark:text-gray-400">系统设置功能正在开发中...</p>
    </div>
  </div>
);

export {
  AdminProjects,
  AdminGallery,
  AdminDiary,
  AdminSkills,
  AdminTimeline,
  AdminNetwork,
  AdminAnnouncements,
  AdminUsers,
  AdminSettings,
};
