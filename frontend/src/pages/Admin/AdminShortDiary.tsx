import React, { useState } from 'react';
import { Quote, Edit, Trash2, CalendarDays, ListFilter } from 'lucide-react';
import type { Diary } from '../../lib/api';
import { useShortDiaryList, useCreateDiary, useUpdateDiary, useDeleteDiary } from '../../hooks/queries/diary';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

const STAMP_OPTIONS = ['FLOW', 'READ', 'BUG', 'OBSERVE', 'OFFLINE', 'IDEA', 'DONE', 'MEMO'];

const formFields: FieldConfig[] = [
  { key: 'content', label: '内容', type: 'textarea', required: true, rows: 4, colSpan: 2, placeholder: '记录此刻的想法...' },
  { key: 'stamp', label: '印记', type: 'select', options: STAMP_OPTIONS },
  { key: 'tags', label: '标签', type: 'array', placeholder: '心情, 编码, 感悟', hint: '用逗号分隔多个标签' },
];

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-CN');

const AdminShortDiary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: diaries = [], isLoading: loading, error: queryError, refetch } = useShortDiaryList();
  const createDiary = useCreateDiary();
  const updateDiary = useUpdateDiary();
  const deleteDiary = useDeleteDiary();
  const error = queryError?.message ?? null;

  const form = useEntityForm<Diary>({
    createMutation: createDiary,
    updateMutation: updateDiary,
    deleteMutation: deleteDiary,
    defaults: { type: 'SHORT', content: '', stamp: 'FLOW', tags: [] },
    validate: (data) => (data.content?.trim() ? null : '请输入日记内容'),
    // 短日记入口固定 type，防止误建 LONG 类型
    toSubmit: (data) => ({ ...data, type: 'SHORT' }),
  });

  const filteredDiaries = diaries.filter(
    (d) =>
      d.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.stamp?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats: StatConfig[] = [
    { label: '总短日记', value: diaries.length, icon: <Quote size={20} />, tone: 'purple' },
    {
      label: '本月新增',
      value: diaries.filter((d) => {
        const date = new Date(d.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      icon: <CalendarDays size={20} />,
      tone: 'green',
    },
    { label: '搜索结果', value: filteredDiaries.length, icon: <ListFilter size={20} />, tone: 'gray' },
  ];

  return (
    <AdminPageShell
      title="短日记"
      icon={<Quote size={24} />}
      count={diaries.length}
      countLabel="条短日记"
      createLabel="新建短日记"
      onCreate={form.openCreate}
      loading={loading}
      error={error}
      onRetry={refetch}
      stats={stats}
      statsClassName="md:grid-cols-3"
      search={{ value: searchTerm, onChange: setSearchTerm, placeholder: '搜索短日记...' }}
      isEmpty={filteredDiaries.length === 0}
      emptyTitle={searchTerm ? '未找到匹配的短日记' : '暂无短日记'}
      emptyActionLabel="创建第一条短日记"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                      onClick={() => form.openEdit(diary)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => form.remove(diary.id, '确定要删除这条短日记吗？')}
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
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={`${form.editingItem ? '编辑' : '新建'}短日记`}
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

export default AdminShortDiary;
