import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
  viewCount: number;
  likeCount: number;
  date: string;
}

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.isPublished = filter === 'published';
      }
      const response = await axios.get('/api/posts', { params });
      setPosts(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
      await axios.delete(`/api/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('删除失败');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-ink dark:text-paper text-xl">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink dark:text-paper">文章管理</h1>
          <button className="px-6 py-2 bg-ink text-white dark:text-black rounded-lg hover:bg-ink/80 dark:hover:bg-ink/80 transition-colors">
            + 新建文章
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-black/30 border border-ink/10 dark:border-gray-700 rounded-lg text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-ink text-white dark:text-black'
                  : 'bg-white dark:bg-black/30 text-ink dark:text-gray-300 hover:bg-ink/5 dark:hover:bg-black/20'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'published'
                  ? 'bg-ink text-white dark:text-black'
                  : 'bg-white dark:bg-black/30 text-ink dark:text-gray-300 hover:bg-ink/5 dark:hover:bg-black/20'
              }`}
            >
              已发布
            </button>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink/5 dark:bg-black/20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">标题</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">分类</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">阅读</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">点赞</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-ink/70 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} className="border-b border-ink/10 dark:border-gray-700 hover:bg-ink/5 dark:hover:bg-black/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-ink dark:text-paper">{post.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-ink/10 dark:bg-gray-700 rounded text-sm text-paper dark:text-white">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      post.isPublished
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-ink/20 dark:bg-gray-800 text-ink dark:text-gray-300'
                    }`}>
                      {post.isPublished ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center gap-4 justify-center">
                      <span className="text-ink/70 dark:text-gray-400">{post.viewCount}</span>
                      <span>·</span>
                      <span className="text-ink/70 dark:text-gray-400">{post.likeCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-sm bg-ink/10 dark:bg-black/20 rounded text-ink dark:text-paper hover:bg-ink/20 dark:hover:bg-black/30 transition-colors">
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPosts.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-ink/70 dark:text-gray-400">暂无文章</p>
              <button className="mt-4 px-6 py-2 bg-ink text-white dark:text-black rounded-lg hover:bg-ink/80 dark:hover:bg-ink/80 transition-colors">
                + 新建第一篇文章
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPosts;
