import { Calendar } from 'lucide-react';
import AdminCrudPage from './AdminCrudPage';

export default function AdminTimelinePage() {
  return (
    <AdminCrudPage
      title="时间线管理"
      icon={<Calendar size={24} className="text-gray-700 dark:text-white" />}
      description="管理时间线"
      apiEndpoint="timeline"
      itemKey="title"
      fields={[
        { key: 'year', label: '年份', type: 'text' },
        { key: 'type', label: '类型', type: 'select', options: ['MILESTONE', 'JOB', 'LIFE'] },
      ]}
    />
  );
}
