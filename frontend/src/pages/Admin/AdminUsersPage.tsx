import { Users } from 'lucide-react';
import AdminCrudPage from './AdminCrudPage';

export default function AdminUsersPage() {
  return (
    <AdminCrudPage
      title="用户管理"
      icon={<Users size={24} className="text-gray-700 dark:text-white" />}
      description="管理用户"
      apiEndpoint="users"
      itemKey="username"
    />
  );
}
