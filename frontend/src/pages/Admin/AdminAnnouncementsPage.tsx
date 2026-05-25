import { Globe } from 'lucide-react';
import AdminCrudPage from './AdminCrudPage';

export default function AdminAnnouncementsPage() {
  return (
    <AdminCrudPage
      title="公告管理"
      icon={<Globe size={24} className="text-gray-700 dark:text-white" />}
      description="管理公告"
      apiEndpoint="announcements"
      itemKey="title"
      fields={[{ key: 'content', label: '内容', type: 'textarea' }]}
    />
  );
}
