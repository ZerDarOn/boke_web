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
import { Clock, Eye, Heart } from 'lucide-react';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  CardActions,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

export interface AdminCrudField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'array';
  options?: string[];
  required?: boolean;
}

export interface AdminCrudPageProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  apiEndpoint: string;
  itemKey: string;
  fields?: AdminCrudField[];
}

const ENDPOINT_CONFIG: Record<string, { rootKey: readonly unknown[]; module: CrudApi<Record<string, unknown>> }> = {
  projects: { rootKey: queryKeys.projects.all, module: api.projects as unknown as CrudApi<Record<string, unknown>> },
  diary: { rootKey: queryKeys.diary.all, module: api.diary as unknown as CrudApi<Record<string, unknown>> },
  skills: { rootKey: queryKeys.skills.all, module: api.skills as unknown as CrudApi<Record<string, unknown>> },
  timeline: { rootKey: queryKeys.timeline.all, module: api.timeline as unknown as CrudApi<Record<string, unknown>> },
  network: { rootKey: queryKeys.network.all, module: api.network as unknown as CrudApi<Record<string, unknown>> },
  announcements: { rootKey: queryKeys.announcements.all, module: api.announcements as unknown as CrudApi<Record<string, unknown>> },
  users: { rootKey: ['users'], module: api.users as unknown as CrudApi<Record<string, unknown>> },
};

type CrudItem = Record<string, unknown> & { id: string };

const isActive = (status: string) => {
  const s = status?.toLowerCase();
  return s === 'active' || s === 'published';
};

/**
 * 通用管理页面组件（薄包装版）
 * 用于公告、日记、时间线、用户等标准 CRUD 管理页面，构建在 crud/ 共享原语之上
 */
const AdminCrudPage: React.FC<AdminCrudPageProps> = ({ title, icon, apiEndpoint, itemKey, fields = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  const nameKey = itemKey === 'name' ? 'name' : 'title';
  const formFields: FieldConfig[] = [
    { key: nameKey, label: '标题 / 名称', type: 'text', required: true, colSpan: 2, placeholder: '请输入标题' },
    { key: 'description', label: '描述', type: 'textarea', rows: 3, colSpan: 2, placeholder: '请输入描述' },
    ...fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options,
      required: field.required,
      colSpan: 2 as const,
      placeholder: field.type === 'array' ? `用逗号分隔多个${field.label}` : `请输入${field.label}`,
    })),
  ];

  const form = useEntityForm<CrudItem>({
    createMutation,
    updateMutation,
    deleteMutation,
    defaults: { status: 'ACTIVE' },
    toSubmit: (data) => ({
      ...data,
      ...(data.featured !== undefined ? { featured: data.featured === 'true' || data.featured === true } : {}),
    }),
  });

  const filteredItems = items.filter((item) => {
    const title_ = typeof item.title === 'string' ? item.title : '';
    const name = typeof item.name === 'string' ? item.name : '';
    const extra = typeof item[itemKey] === 'string' ? item[itemKey] : '';
    const matchesSearch =
      title_.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      extra.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    const status = typeof item.status === 'string' ? item.status : '';
    if (filter === 'active') return isActive(status);
    return !isActive(status);
  });

  const stats: StatConfig[] = [
    {
      label: '活跃',
      value: items.filter((item) => isActive(typeof item.status === 'string' ? item.status : '')).length,
      icon: <Eye size={20} />,
      tone: 'green',
    },
    {
      label: '草稿',
      value: items.filter((item) => !isActive(typeof item.status === 'string' ? item.status : '')).length,
      icon: <Clock size={20} />,
      tone: 'yellow',
    },
    {
      label: '总浏览',
      value: items.reduce((sum, item) => sum + (typeof item.viewCount === 'number' ? item.viewCount : 0), 0),
      icon: <Eye size={20} />,
      tone: 'blue',
    },
    {
      label: '总互动',
      value: items.reduce((sum, item) => sum + (typeof item.likeCount === 'number' ? item.likeCount : 0), 0),
      icon: <Heart size={20} />,
      tone: 'pink',
    },
  ];

  const filterTabs = ['all', 'active', 'inactive'].map((key) => ({ key, label: key === 'all' ? '全部' : key === 'active' ? '活跃' : '草稿' }));

  return (
    <AdminPageShell
      title={title}
      icon={icon}
      count={items.length}
      countLabel={`个${title}`}
      createLabel={`新建${title}`}
      onCreate={form.openCreate}
      loading={loading}
      error={error}
      onRetry={refetch}
      stats={stats}
      search={{ value: searchTerm, onChange: setSearchTerm, placeholder: `搜索${title}...` }}
      filters={
        <div className="flex items-center gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={
                'px-4 py-3 rounded-xl transition-colors ' +
                (filter === tab.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
      isEmpty={filteredItems.length === 0}
      emptyTitle={`${searchTerm ? '未找到匹配的' : '暂无'}${title}`}
      emptyActionLabel={`创建第一个${title}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={String(item.id)}
            className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {(typeof item.title === 'string' && item.title) ||
                    (typeof item.name === 'string' && item.name) ||
                    (typeof item[itemKey] === 'string' ? item[itemKey] : '')}
                </h3>
                <span
                  className={
                    'px-2 py-1 rounded-full text-xs font-medium ' +
                    (isActive(typeof item.status === 'string' ? item.status : '')
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300')
                  }
                >
                  {isActive(typeof item.status === 'string' ? item.status : '') ? '活跃' : '草稿'}
                </span>
              </div>
              <CardActions
                editLabel="编辑"
                deleteLabel="删除"
                onEdit={() => form.openEdit(item as CrudItem)}
                onDelete={() => form.remove(String(item.id))}
              />
            </div>
          </div>
        ))}
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={`${form.editingItem ? '编辑' : '新建'}${title}`}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        size="md"
      >
        <FormFields fields={formFields} formData={form.formData} onChange={form.setField} accent="purple" />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminCrudPage;
