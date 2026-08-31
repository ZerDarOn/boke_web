import React, { useState } from 'react';
import type { Project } from '../../lib/api';
import {
  useProjectsList,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/queries/projects';
import { Code, LayoutGrid, FileText, Rocket, Archive, CheckCircle2 } from 'lucide-react';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  CardActions,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'ARCHIVED', label: 'ARCHIVED' },
  { value: 'DEPLOYED', label: 'DEPLOYED' },
];

const CARD_FIELDS: FieldConfig[] = [
  { key: 'name', label: '项目名称', type: 'text', required: true, placeholder: '请输入项目名称' },
  { key: 'slug', label: 'URL别名', type: 'text', required: true, placeholder: 'url-slug' },
  { key: 'type', label: '项目类型', type: 'text', required: true, placeholder: 'BLOG SYSTEM' },
  { key: 'tech', label: '技术栈', type: 'array', placeholder: 'React, TypeScript, Node.js' },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { key: 'featured', label: '首页展示', type: 'boolean' },
  { key: 'githubUrl', label: 'GitHub链接', type: 'text', placeholder: 'https://github.com/...' },
  { key: 'demoUrl', label: '演示链接', type: 'text', placeholder: 'https://...' },
  { key: 'link', label: '项目链接', type: 'text', colSpan: 2, placeholder: 'https://...' },
  { key: 'imageUrl', label: '项目截图', type: 'text', colSpan: 2, placeholder: '图片URL或CSS渐变' },
  { key: 'description', label: '简介', type: 'textarea', rows: 3, colSpan: 2, placeholder: '项目简介...' },
];

const DETAIL_FIELDS: FieldConfig[] = [
  { key: 'name', label: '项目名称', type: 'text', disabled: true },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { key: 'description', label: '简介描述', type: 'textarea', rows: 3, colSpan: 2, placeholder: '项目简介（显示在详情页顶部）...' },
  {
    key: 'readme',
    label: 'README 文档 (支持 Markdown)',
    type: 'textarea',
    rows: 20,
    colSpan: 2,
    inputClassName: 'font-mono text-sm',
    placeholder: '# 项目名称\n\n项目描述...\n\n## 功能特性\n\n- 功能1\n- 功能2',
  },
];

const isActive = (status?: string) => {
  const s = status?.toLowerCase();
  return s === 'active' || s === 'published';
};

const AdminProjectsPage: React.FC = () => {
  const { data: items = [], isLoading: loading, error: queryError, refetch } = useProjectsList({ limit: 500 });
  const error = queryError?.message ?? null;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editMode, setEditMode] = useState<'card' | 'detail'>('card');

  const form = useEntityForm<Project>({
    createMutation: createProject,
    updateMutation: updateProject,
    deleteMutation: deleteProject,
    defaults: { status: 'ACTIVE', featured: false },
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'active') return isActive(item.status);
    return !isActive(item.status);
  });

  const stats: StatConfig[] = [
    {
      label: '活跃项目',
      value: items.filter((i) => i.status === 'ACTIVE').length,
      icon: <Rocket size={32} />,
      tone: 'purple',
      variant: 'solid',
    },
    {
      label: '已部署',
      value: items.filter((i) => i.status === 'DEPLOYED').length,
      icon: <CheckCircle2 size={32} />,
      tone: 'green',
      variant: 'solid',
    },
    {
      label: '已归档',
      value: items.filter((i) => i.status === 'ARCHIVED').length,
      icon: <Archive size={32} />,
      tone: 'gray',
      variant: 'solid',
    },
  ];

  const filterTabs = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setFilter('all')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          filter === 'all'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        全部
      </button>
      <button
        onClick={() => setFilter('active')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          filter === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        活跃
      </button>
      <button
        onClick={() => setFilter('inactive')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          filter === 'inactive'
            ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        草稿
      </button>
    </div>
  );

  return (
    <AdminPageShell
      title="项目管理"
      icon={<Code size={24} className="text-gray-700 dark:text-white" />}
      count={items.length}
      countLabel="个项目"
      createLabel="新建项目"
      onCreate={form.openCreate}
      loading={loading}
      error={error}
      onRetry={refetch}
      stats={stats}
      statsClassName="md:grid-cols-3"
      filterVariant="bare"
      search={{ value: searchTerm, onChange: setSearchTerm, placeholder: '搜索项目...' }}
      filters={
        <>
          {filterTabs}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">编辑模式:</span>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setEditMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  editMode === 'card'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={14} />
                卡片
              </button>
              <button
                onClick={() => setEditMode('detail')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  editMode === 'detail'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText size={14} />
                详情
              </button>
            </div>
          </div>
        </>
      }
      isEmpty={filteredItems.length === 0}
      emptyTitle={searchTerm ? '未找到匹配的项目' : '暂无项目'}
      emptyActionLabel="创建第一个项目"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {item.name}
                </h3>
                <span
                  className={
                    'px-2 py-1 rounded-full text-xs font-medium ' +
                    (isActive(item.status)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300')
                  }
                >
                  {isActive(item.status) ? '活跃' : '草稿'}
                </span>
              </div>
              {editMode === 'detail' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                  {item.readme ? '✓ 有详细文档' : '✗ 暂无详细文档'}
                </p>
              )}
              <CardActions
                editLabel={editMode === 'card' ? '编辑' : '编辑详情'}
                onEdit={() => form.openEdit(item)}
                onDelete={() => form.remove(item.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={`${form.editingItem ? '编辑' : '新建'}项目${editMode === 'detail' ? '详情' : ''}`}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        size={editMode === 'detail' ? 'xl' : 'md'}
      >
        {editMode === 'detail' && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-purple-700 dark:text-purple-300">💡 详情模式用于编辑完整的 README 文档内容，支持 Markdown 格式</p>
          </div>
        )}
        <FormFields
          fields={editMode === 'card' ? CARD_FIELDS : DETAIL_FIELDS}
          formData={form.formData}
          onChange={form.setField}
          accent="purple"
        />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminProjectsPage;
