import React, { useState } from 'react';
import {
  useAdminActivitiesConfig,
  useSaveAdminActivities,
  type AdminActivity,
} from '../../hooks/queries/settings';
import { Edit, Trash2, Activity, CheckCircle, Clock, AlertCircle, Database } from 'lucide-react';
import { LATEST_ACTIVITIES } from '../../constants';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  useEntityForm,
  type CrudMutation,
  type FieldConfig,
  type StatConfig,
} from './crud';

type Activity = AdminActivity;

const STATUS_OPTIONS = [
  { value: 'DONE', label: '已完成', icon: CheckCircle, color: 'text-green-500' },
  { value: 'IN_PROGRESS', label: '进行中', icon: Clock, color: 'text-yellow-500' },
  { value: 'PLANNED', label: '计划中', icon: AlertCircle, color: 'text-blue-500' },
];

const formFields: FieldConfig[] = [
  { key: 'project', label: '项目', type: 'text', required: true, placeholder: '项目名称，如 ink-spirit-blog' },
  { key: 'title', label: '标题', type: 'text', required: true, placeholder: '动态标题', colSpan: 2 },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { key: 'date', label: '日期', type: 'date', required: true },
  { key: 'tags', label: '标签', type: 'array', placeholder: 'React, TypeScript, Vite', hint: '用逗号分隔多个标签' },
];

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-CN');

const getStatusConfig = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

const AdminActivities: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: activities = [], isLoading: loading, error: queryError, refetch } = useAdminActivitiesConfig();
  const saveActivitiesMutation = useSaveAdminActivities();
  const saving = saveActivitiesMutation.isPending;
  const error = queryError?.message ?? null;

  // 动态数据整份存于 SiteConfig，无逐条接口 —— 用适配器把「全量保存」
  // 包装成 crud 原语期望的单实体增删改形状
  const saveAll = async (next: Activity[]) => {
    await saveActivitiesMutation.mutateAsync(next);
  };

  const createMutation: CrudMutation = {
    mutateAsync: (data: Record<string, unknown>) =>
      saveAll([{ ...(data as unknown as Activity), id: `act_${Date.now()}` }, ...activities]),
    isPending: saving,
  };
  const updateMutation: CrudMutation = {
    mutateAsync: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      saveAll(activities.map((a) => (a.id === id ? ({ ...a, ...data } as unknown as Activity) : a))),
    isPending: saving,
  };
  const deleteMutation: CrudMutation = {
    mutateAsync: (id: string) => saveAll(activities.filter((a) => a.id !== id)),
    isPending: saving,
  };

  const form = useEntityForm<Activity>({
    createMutation,
    updateMutation,
    deleteMutation,
    defaults: {
      project: '',
      title: '',
      tags: [],
      status: 'DONE',
      date: new Date().toISOString().split('T')[0],
    },
    validate: (data) =>
      data.title?.trim() && data.project?.trim() ? null : '请填写项目和标题',
  });

  const handleReinitialize = async () => {
    if (!(await confirm({ message: '确定要重置为默认数据吗？这会覆盖所有现有动态。' }))) return;

    const defaultActivities = LATEST_ACTIVITIES.map((a) => ({
      ...a,
      status: a.status as 'DONE' | 'IN_PROGRESS' | 'PLANNED',
    }));

    try {
      await saveAll(defaultActivities);
      toast.success('重置成功！');
    } catch {
      toast.error('保存失败');
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats: StatConfig[] = [
    { label: '总动态数', value: activities.length, icon: <Activity size={20} />, tone: 'gray' },
    { label: '已完成', value: activities.filter((a) => a.status === 'DONE').length, icon: <CheckCircle size={20} />, tone: 'green' },
    { label: '进行中', value: activities.filter((a) => a.status === 'IN_PROGRESS').length, icon: <Clock size={20} />, tone: 'yellow' },
    { label: '计划中', value: activities.filter((a) => a.status === 'PLANNED').length, icon: <AlertCircle size={20} />, tone: 'blue' },
  ];

  return (
    <AdminPageShell
      title="动态管理"
      icon={<Activity size={24} />}
      count={activities.length}
      countLabel="条动态"
      createLabel="新建动态"
      onCreate={form.openCreate}
      headerActions={
        <button
          onClick={handleReinitialize}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
        >
          <Database size={16} />
          重置为默认数据
        </button>
      }
      loading={loading}
      error={error}
      onRetry={() => refetch()}
      stats={stats}
      search={{ value: searchTerm, onChange: setSearchTerm, placeholder: '搜索动态...' }}
      isEmpty={filteredActivities.length === 0}
      emptyTitle={searchTerm ? '未找到匹配的动态' : '暂无动态'}
      emptyActionLabel="创建第一条动态"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 ${statusConfig.color}`}>
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
                        onClick={() => form.openEdit(activity)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => form.remove(activity.id, '确定要删除这条动态吗？')}
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
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={`${form.editingItem ? '编辑' : '新建'}动态`}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        size="md"
      >
        <FormFields fields={formFields} formData={form.formData} onChange={form.setField} />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminActivities;
