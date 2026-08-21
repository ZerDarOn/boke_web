import { FileText } from 'lucide-react';
import AdminCrudPage from './AdminCrudPage';

export default function AdminDiaryPage() {
  return (
    <AdminCrudPage
      title="日记管理"
      icon={<FileText size={24} className="text-gray-700 dark:text-white" />}
      description="管理短笺与长日记；长日记请填写标题和正文"
      apiEndpoint="diary"
      itemKey="title"
      fields={[
        { key: 'type', label: '日记类型', type: 'select', options: ['SHORT', 'LONG'] },
        { key: 'content', label: '短笺内容', type: 'textarea' },
        { key: 'longContent', label: '长日记正文', type: 'textarea' },
        { key: 'subtitle', label: '副标题', type: 'text' },
        { key: 'mood', label: '心情', type: 'text' },
        { key: 'weather', label: '天气', type: 'text' },
        { key: 'location', label: '地点', type: 'text' },
        { key: 'coverImage', label: '封面图片 URL', type: 'text' },
        { key: 'tags', label: '标签', type: 'array' },
        { key: 'readingTime', label: '阅读时长', type: 'text' },
      ]}
    />
  );
}
