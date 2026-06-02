import React, { useState, useEffect, useMemo } from 'react';
import { api, AccessLevel } from '../../lib/api';
import {
  usePostsList,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
} from '../../hooks/queries/posts';
import { uploadImage } from '../../lib/upload';
import { Search, Plus, Edit, Trash2, FileText, Clock, Eye, Heart, Loader2, X, Save, Image, Lock, Globe, Key } from 'lucide-react';

// 简单的 Markdown 编辑器组件
const SimpleMarkdownEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  height?: number;
}> = ({ value, onChange, height = 300 }) => {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
        <span className="text-xs text-gray-500">Markdown 编辑器</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs text-gray-400">支持 **粗体** *斜体* `代码`</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height }}
        className="w-full px-4 py-3 font-mono text-sm resize-none focus:outline-none"
        placeholder="在此输入 Markdown 内容..."
      />
    </div>
  );
};

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  category: string;
  isPublished: boolean;
  viewCount: number;
  likeCount: number;
  date: string;
  excerpt?: string;
  accessLevel?: AccessLevel;
  password?: string;
}

const AdminPosts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data: allPosts = [], isLoading: loading, error: queryError, refetch } = usePostsList({ limit: 500 });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const posts = useMemo(() => {
    if (filter === 'all') return allPosts as Post[];
    return (allPosts as Post[]).filter((p) =>
      filter === 'published' ? p.isPublished : !p.isPublished
    );
  }, [allPosts, filter]);

  const error = queryError?.message ?? null;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<Partial<Post>>({});
  const isSubmitting = createPost.isPending || updatePost.isPending;
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await deletePost.mutateAsync(id);
    } catch {
      alert('删除失败');
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({ ...post });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      isPublished: false,
      accessLevel: 'PUBLIC',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
    setFormData({});
  };

  const handleInputChange = (key: keyof Post, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // 处理图片上传到服务器
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);

      // 上传到服务器
      const imageUrl = await uploadImage(file, 'posts');

      // 在当前光标位置插入 Markdown 图片语法
      const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
      const currentContent = formData.content || '';
      handleInputChange('content', currentContent + imageMarkdown);
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片上传失败';
      alert(errorMessage);
    } finally {
      setUploadingImage(false);
      // 清空 input 以便重复选择同一文件
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, data: formData });
      } else {
        await createPost.mutateAsync(formData as Parameters<typeof createPost.mutateAsync>[0]);
      }
      handleCloseModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      alert(editingPost ? `更新失败: ${message}` : `创建失败: ${message}`);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-lg">加载文章列表中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 font-mono text-sm">
          ERROR: {error}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-600 dark:text-red-300 underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink/20 to-purple-500/20 flex items-center justify-center">
            <FileText size={24} className="text-ink dark:text-paper" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-paper">文章管理</h1>
            <p className="text-ink/70 dark:text-gray-400">共 {posts.length} 篇文章</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          新建文章
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-ink/10 to-purple-600/5 dark:from-ink/20 dark:to-purple-800/10 rounded-xl p-5 border border-ink/10 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">已发布</p>
              <p className="text-2xl font-bold text-ink dark:text-purple-400">
                {posts.filter(p => p.isPublished).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-ink/10 dark:bg-purple-900/30 flex items-center justify-center">
              <Eye size={20} className="text-ink dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/5 dark:from-yellow-900/20 dark:to-orange-800/10 rounded-xl p-5 border border-yellow-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">草稿</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-orange-400">
                {posts.filter(p => !p.isPublished).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 dark:from-blue-900/20 dark:to-cyan-800/10 rounded-xl p-5 border border-blue-200 dark:border-cyan-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">总阅读</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-cyan-400">
                {posts.reduce((sum, p) => sum + p.viewCount, 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Eye size={20} className="text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500/10 to-red-600/5 dark:from-pink-900/20 dark:to-red-800/10 rounded-xl p-5 border border-pink-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">总点赞</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-red-400">
                {posts.reduce((sum, p) => sum + p.likeCount, 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-red-900/30 flex items-center justify-center">
              <Heart size={20} className="text-pink-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-black/30 rounded-xl p-5 border border-ink/10 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-gray-500" />
            <input
              type="text"
              placeholder="搜索文章标题或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-ink/50 focus:border-ink/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'all'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'published'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                已发布
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  filter === 'draft'
                    ? 'bg-ink text-white dark:text-black'
                    : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
                }`}
              >
                草稿
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPost ? '编辑文章' : '新建文章'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入文章标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    别名 (slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="article-url-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="文章分类"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    摘要
                  </label>
                  <textarea
                    value={formData.excerpt || ''}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="文章摘要"
                  />
                </div>

                 {/* 图片上传 */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     插入图片
                   </label>
                   <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors w-fit">
                     {uploadingImage ? (
                       <>
                         <Loader2 size={18} className="text-blue-600 animate-spin" />
                         <span className="text-sm text-blue-600">上传中...</span>
                       </>
                    ) : (
                      <>
                        <Image size={18} className="text-gray-600" />
                        <span className="text-sm text-gray-700">选择图片上传</span>
                      </>
                    )}
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleImageUpload}
                       className="hidden"
                       disabled={uploadingImage}
                     />
                   </label>
                   <p className="text-xs text-gray-500 mt-1">支持 JPG/PNG/GIF/WebP，最大 10MB，图片将上传到服务器</p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     内容 (Markdown)
                   </label>
                   <SimpleMarkdownEditor
                     value={formData.content || ''}
                     onChange={(v) => handleInputChange('content', v)}
                     height={300}
                   />
                 </div>

                 <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     id="isPublished"
                     checked={formData.isPublished || false}
                     onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                     className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   />
                   <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                     立即发布
                   </label>
                 </div>

                {/* 访问权限设置 */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    访问权限
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="accessLevel"
                        value="PUBLIC"
                        checked={formData.accessLevel === 'PUBLIC' || !formData.accessLevel}
                        onChange={() => handleInputChange('accessLevel', 'PUBLIC')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-green-500" />
                          <span className="font-medium text-gray-900">公开</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">所有人都可以查看此文章</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="accessLevel"
                        value="PASSWORD"
                        checked={formData.accessLevel === 'PASSWORD'}
                        onChange={() => handleInputChange('accessLevel', 'PASSWORD')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Key size={16} className="text-amber-500" />
                          <span className="font-medium text-gray-900">密码保护</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">访问者需要输入密码才能查看</p>
                      </div>
                    </label>

                    {formData.accessLevel === 'PASSWORD' && (
                      <div className="ml-7">
                        <input
                          type="text"
                          value={formData.password || ''}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="请输入访问密码"
                        />
                        <p className="text-xs text-gray-400 mt-1">请妥善保管密码，访客需要此密码才能查看文章</p>
                      </div>
                    )}

                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="accessLevel"
                        value="PRIVATE"
                        checked={formData.accessLevel === 'PRIVATE'}
                        onChange={() => handleInputChange('accessLevel', 'PRIVATE')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-red-500" />
                          <span className="font-medium text-gray-900">私密</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">仅管理员可以在后台查看</p>
                      </div>
                    </label>
                  </div>
                </div>
               </div>
             </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div 
              key={post.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-ink dark:text-paper text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    post.isPublished
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-ink/20 dark:bg-gray-800 text-ink dark:text-gray-300'
                  }`}>
                    {post.isPublished ? '已发布' : '草稿'}
                  </span>
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-ink/70 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-4 text-ink/70 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye size={14} className="text-ink/40 dark:text-gray-500" />
                      <span>{post.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-ink/40 dark:text-gray-500" />
                      <span>{post.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-ink/40 dark:text-gray-500" />
                      <span>{new Date(post.date).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-ink/10 dark:bg-black/20 rounded-md text-ink dark:text-paper">
                      {post.category}
                    </span>
                    {/* 访问权限标识 */}
                    {post.accessLevel === 'PASSWORD' && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Key size={12} />
                        密码保护
                      </span>
                    )}
                    {post.accessLevel === 'PRIVATE' && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-md text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Lock size={12} />
                        私密
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleEdit(post)}
                    className="flex-1 py-2 px-3 bg-ink text-white rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-black/30 rounded-xl p-16 text-center border border-ink/10 dark:border-gray-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">
            {searchTerm ? '未找到匹配的文章' : '暂无文章'}
          </h3>
          <p className="text-ink/70 dark:text-gray-400 mb-6">
            {searchTerm ? '尝试其他搜索关键词' : '点击右上角按钮创建第一篇文章'}
          </p>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium mx-auto"
          >
            <Plus size={18} />
            新建文章
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
