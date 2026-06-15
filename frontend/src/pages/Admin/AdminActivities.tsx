import React, { useState } from 'react';
import {
  useAdminActivitiesConfig,
  useSaveAdminActivities,
  type AdminActivity,
} from '../../hooks/queries/settings';
import { Search, Plus, Edit, Trash2, Loader2, X, Save, Activity, CheckCircle, Clock, AlertCircle, Database } from 'lucide-react';
import { LATEST_ACTIVITIES } from '../../constants';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

type Activity = AdminActivity;

const STATUS_OPTIONS = [
  { value: 'DONE', label: '已完成', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500' },
  { value: 'IN_PROGRESS', label: '进行中', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
  { value: 'PLANNED', label: '计划中', icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-500' },
];

const AdminActivities: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const { data: activities = [], isLoading: loading, error: queryError } = useAdminActivitiesConfig();
  const saveActivitiesMutation = useSaveAdminActivities();
  const saving = saveActivitiesMutation.isPending;
  const error = queryError?.message ?? null;
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<Partial<Activity>>({
    project: '',
    title: '',
    tags: [],
    status: 'DONE',
    date: new Date().toISOString().split('T')[0]
  });

  // 从默认数据重新初始化（覆盖当前数据）
  const handleReinitialize = async () => {
    if (!(await confirm({ message: '确定要重置为默认数据吗？这会覆盖所有现有动态。' }))) return;

    const defaultActivities = LATEST_ACTIVITIES.map(a => ({
      ...a,
      status: a.status as 'DONE' | 'IN_PROGRESS' | 'PLANNED'
    }));

    const success = await saveActivities(defaultActivities);
    if (success) {
      toast.success('重置成功！');
    }
  };

  const saveActivities = async (newActivities: Activity[]) => {
    try {
      await saveActivitiesMutation.mutateAsync(newActivities);
      return true;
    } catch {
      toast.error('保存失败');
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '确定要删除这条动态吗？' }))) return;

    const newActivities = activities.filter(a => a.id !== id);
    await saveActivities(newActivities);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({ ...activity });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingActivity(null);
    setFormData({
      project: '',
      title: '',
      tags: [],
      status: 'DONE',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.project?.trim()) {
      toast.warning('请填写项目和标题');
      return;
    }

    let newActivities: Activity[];
    if (editingActivity) {
      newActivities = activities.map(a => 
        a.id === editingActivity.id 
          ? { ...a, ...formData } as Activity
          : a
      );
    } else {
      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        project: formData.project || '',
        title: formData.title || '',
        tags: formData.tags || [],
        status: (formData.status as 'DONE' | 'IN_PROGRESS' | 'PLANNED') || 'DONE',
        date: formData.date || new Date().toISOString().split('T')[0]
      };
      newActivities = [newActivity, ...activities];
    }

    const success = await saveActivities(newActivities);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const filteredActivities = activities.filter(activity => 
    activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
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
              placeholder="搜索动态..."
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
          新建动态
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">总动态数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">已完成</p>
              <p className="text-2xl font-bold text-green-500">
                {activities.filter(a => a.status === 'DONE').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">进行中</p>
              <p className="text-2xl font-bold text-yellow-500">
                {activities.filter(a => a.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">计划中</p>
              <p className="text-2xl font-bold text-blue-500">
                {activities.filter(a => a.status === 'PLANNED').length}
              </p>
            </div>
          </div>

           {/* Activities List */}
           <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50 dark:bg-gray-900/50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">项目</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">标题</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">标签</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">日期</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                   {filteredActivities.map((activity) => {
                     const statusConfig = getStatusConfig(activity.status);
                     const StatusIcon = statusConfig.icon;
                     return (
                       <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                         <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} bg-opacity-10 border border-opacity-20`}>
                             <StatusIcon size={12} />
                             {statusConfig.label}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                           {activity.project}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                           {activity.title}
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1">
                             {activity.tags?.map((tag, idx) => (
                               <span key={idx} className="px-2 py-0.5 text-xs bg-neon/10 text-neon rounded">
                                 {tag}
                               </span>
                             ))}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           {formatDate(activity.date)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <button
                             onClick={() => handleEdit(activity)}
                             className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                           >
                             <Edit size={18} />
                           </button>
                           <button
                             onClick={() => handleDelete(activity.id)}
                             className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                           >
                             <Trash2 size={18} />
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
             
             {filteredActivities.length === 0 && (
               <div className="text-center py-12">
                 <p className="text-gray-500 dark:text-gray-400 mb-4">暂无动态</p>
                 <button
                   onClick={handleReinitialize}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <Database size={18} />
                   重置为默认数据
                 </button>
               </div>
             )}
           </div>

           {/* Quick Actions */}
           {filteredActivities.length > 0 && (
             <div className="flex items-center justify-end gap-3">
               <button
                 onClick={handleReinitialize}
                 className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
               >
                 <Database size={16} />
                 重置为默认数据
               </button>
             </div>
           )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingActivity ? '编辑动态' : '新建动态'}
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
                  项目 *
                </label>
                <input
                  type="text"
                  value={formData.project || ''}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="项目名称，如 ink-spirit-blog"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标题 *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="动态标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  状态
                </label>
                <select
                  value={formData.status || 'DONE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  required
                />
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
                  placeholder="React, TypeScript, Vite"
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
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingActivity ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivities;
