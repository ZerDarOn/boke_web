import { FileText } from 'lucide-react';
import AdminCrudPage from './AdminCrudPage';

export default function AdminDiaryPage() {
  return (
    <AdminCrudPage
      title="日记管理"
      icon={<FileText size={24} className="text-gray-700 dark:text-white" />}
      description="管理日记"
      apiEndpoint="diary"
      itemKey="title"
      fields={[
        { key: 'content', label: '内容', type: 'textarea' },
        { key: 'mood', label: '心情', type: 'text' },
      ]}
    />
  );
}
