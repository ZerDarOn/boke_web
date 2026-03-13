import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/apiConfig';
import {
  Download,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  Archive,
  BookOpen,
  Video,
  Calendar,
  Code2,
  Images,
  Megaphone
} from 'lucide-react';

interface ExportStats {
  posts: number;
  projects: number;
  anime: number;
  diaries: number;
  timeline: number;
  skills: number;
  gallery: number;
  announcements: number;
  total: number;
}

const ContentExport: React.FC = () => {
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [downloadImages, setDownloadImages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/export/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch stats');
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(err.message || 'Failed to fetch stats');
    }
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    setError(null);

    try {
      const url = type === 'all'
        ? `${API_BASE_URL}/api/export/all?downloadImages=${downloadImages}`
        : `${API_BASE_URL}/api/export/${type}?downloadImages=${downloadImages}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'all' ? 'blog-backup.zip' : `${type}-backup.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const exportTypes = [
    {
      id: 'all',
      name: '全部内容',
      icon: Archive,
      description: '导出所有类型的博客内容',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'post',
      name: '文章',
      icon: FileText,
      count: stats?.posts || 0,
      description: '所有博客文章',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'project',
      name: '项目',
      icon: Code2,
      count: stats?.projects || 0,
      description: '所有项目展示',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'anime',
      name: '动漫',
      icon: Video,
      count: stats?.anime || 0,
      description: '所有动漫记录',
      color: 'bg-pink-600 hover:bg-pink-700'
    },
    {
      id: 'diary',
      name: '日记',
      icon: BookOpen,
      count: stats?.diaries || 0,
      description: '所有日记条目',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      id: 'timeline',
      name: '时间线',
      icon: Calendar,
      count: stats?.timeline || 0,
      description: '所有时间线事件',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      id: 'skill',
      name: '技能',
      icon: FileText,
      count: stats?.skills || 0,
      description: '所有技能展示',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      id: 'gallery',
      name: '相册',
      icon: Images,
      count: stats?.gallery || 0,
      description: '所有相册照片',
      color: 'bg-teal-600 hover:bg-teal-700'
    },
    {
      id: 'announcement',
      name: '公告',
      icon: Megaphone,
      count: stats?.announcements || 0,
      description: '所有公告信息',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold text-ink dark:text-paper mb-2">内容导出</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          将博客内容导出为 Markdown 文件，方便备份和迁移
        </p>
      </div>

      {/* 导出选项 */}
      <div className="bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-ink dark:text-paper mb-4">导出选项</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={downloadImages}
            onChange={(e) => setDownloadImages(e.target.checked)}
            className="mr-3 w-5 h-5 rounded"
          />
          <div className="flex items-center gap-2">
            <Image size={20} />
            <span className="text-ink dark:text-paper">下载图片</span>
          </div>
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-8">
          选中后，会将内容中的图片也下载到 ZIP 文件中
        </p>
      </div>

      {/* 导出按钮 */}
      <div className="bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-ink dark:text-paper mb-4">导出</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportTypes.map((type) => {
            const Icon = type.icon;
            const isExporting = exporting === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleExport(type.id)}
                disabled={isExporting || loading}
                className={`
                  flex items-center gap-3 p-4 rounded-lg transition-colors
                  ${type.color}
                  ${(isExporting || loading) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isExporting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Icon size={20} />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{type.name}</div>
                  {type.count !== undefined && (
                    <div className="text-sm opacity-80">{type.count} 项</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-900 dark:text-red-100">导出失败</div>
            <div className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Download size={18} />
          <span>导出说明</span>
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-7 list-disc">
          <li>导出的文件会按类型组织在 `content/` 目录下</li>
          <li>所有文件都包含完整的 Front Matter 元数据</li>
          <li>支持重新导入到博客（使用内容导入功能）</li>
          <li>建议定期备份重要内容</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentExport;
