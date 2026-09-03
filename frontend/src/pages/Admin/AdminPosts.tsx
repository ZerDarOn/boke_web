import React, { useState, useMemo } from 'react';
import { AccessLevel } from '../../lib/api';
import {
  usePostsList,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
} from '../../hooks/queries/posts';
import { uploadImage } from '../../lib/upload';
import { Edit, Trash2, FileText, Clock, Eye, Heart, Image as ImageIcon, Key, Lock } from 'lucide-react';
import { useToastActions } from '../../contexts/ToastContext';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

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
  coverImage?: string;
  accessLevel?: AccessLevel;
  password?: string;
}

// 简单的 Markdown 编辑器组件
const SimpleMarkdownEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  height?: number;
}> = ({ value, onChange, height = 300 }) => {
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600 flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Markdown 编辑器</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs text-gray-400">支持 **粗体** *斜体* `代码`</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height }}
        className="w-full px-4 py-3 font-mono text-sm resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        placeholder="在此输入 Markdown 内容..."
      />
    </div>
  );
};

const AdminPosts: React.FC = () => {
  const toast = useToastActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [insertingImage, setInsertingImage] = useState(false);

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

  const form = useEntityForm<Post>({
    createMutation: createPost,
    updateMutation: updatePost,
    deleteMutation: deletePost,
    defaults: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      isPublished: false,
      accessLevel: 'PUBLIC',
      password: '',
    },
    validate: (data) => (data.title?.trim() ? null : '请输入文章标题'),
  });

  // 上传图片并把 Markdown 图片语法追加到内容末尾
  const handleInsertImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChangeContent: (value: string) => void,
    currentContent: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setInsertingImage(true);
      const imageUrl = await uploadImage(file, 'posts');
      onChangeContent(`${currentContent}\n![${file.name}](${imageUrl})\n`);
    } catch (err) {
      console.error('❌ 图片上传失败:', err);
      toast.error(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setInsertingImage(false);
      // 清空 input 以便重复选择同一文件
      e.target.value = '';
    }
  };

  const formFields: FieldConfig[] = [
    { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入文章标题' },
    { key: 'slug', label: '别名 (slug)', type: 'text', placeholder: 'article-url-slug' },
    { key: 'category', label: '分类', type: 'text', placeholder: '文章分类' },
    { key: 'isPublished', label: '立即发布', type: 'checkbox' },
    { key: 'excerpt', label: '摘要', type: 'textarea', rows: 3, placeholder: '文章摘要', colSpan: 2 },
    { key: 'coverImage', label: '封面图', type: 'image', uploadType: 'posts', previewClassName: 'w-48 h-32' },
    {
      key: 'accessLevel',
      label: '访问权限',
      type: 'select',
      options: [
        { value: 'PUBLIC', label: '公开（所有人可查看）' },
        { value: 'PASSWORD', label: '密码保护（需输入密码）' },
        { value: 'PRIVATE', label: '私密（仅管理员可见）' },
      ],
    },
    {
      key: 'password',
      label: '访问密码',
      type: 'text',
      placeholder: '请输入访问密码',
      hint: '访客需要此密码才能查看文章',
      inputClassName: 'font-mono',
      visible: (fd) => fd.accessLevel === 'PASSWORD',
    },
    {
      key: 'content',
      label: '内容 (Markdown)',
      type: 'custom',
      colSpan: 2,
      render: (value, onChange, formData) => (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
            <ImageIcon size={18} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {insertingImage ? '上传中...' : '插入图片'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleInsertImage(e, onChange as (v: string) => void, String(formData.content ?? ''))}
              className="hidden"
              disabled={insertingImage}
            />
          </label>
          <p className="text-xs text-gray-500">支持 JPG/PNG/GIF/WebP，最大 10MB，图片将上传到服务器</p>
          <SimpleMarkdownEditor
            value={String(value ?? '')}
            onChange={onChange as (v: string) => void}
            height={300}
          />
        </div>
      ),
    },
  ];

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats: StatConfig[] = [
    { label: '已发布', value: posts.filter((p) => p.isPublished).length, icon: <Eye size={20} />, tone: 'green' },
    { label: '草稿', value: posts.filter((p) => !p.isPublished).length, icon: <Clock size={20} />, tone: 'yellow' },
    { label: '总阅读', value: posts.reduce((sum, p) => sum + p.viewCount, 0), icon: <Eye size={20} />, tone: 'blue' },
    { label: '总点赞', value: posts.reduce((sum, p) => sum + p.likeCount, 0), icon: <Heart size={20} />, tone: 'pink' },
  ];

  const filterTabs = (['all', 'published', 'draft'] as const).map((value) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
        filter === value
          ? 'bg-ink text-white dark:text-black'
          : 'bg-ink/5 dark:bg-black/20 text-ink dark:text-gray-300 hover:bg-ink/10 dark:hover:bg-black/30'
      }`}
    >
      {value === 'all' ? '全部' : value === 'published' ? '已发布' : '草稿'}
    </button>
  ));

  return (
    <AdminPageShell
      title="文章管理"
      icon={<FileText size={24} />}
      count={posts.length}
      countLabel="篇文章"
      createLabel="新建文章"
      onCreate={form.openCreate}
      loading={loading}
      loadingText="加载文章列表中..."
      error={error}
      onRetry={() => refetch()}
      stats={stats}
      search={{ value: searchTerm, onChange: setSearchTerm, placeholder: '搜索文章标题或分类...' }}
      filters={filterTabs}
      filterVariant="bare"
      isEmpty={filteredPosts.length === 0}
      emptyTitle={searchTerm ? '未找到匹配的文章' : '暂无文章'}
      emptyActionLabel="创建第一篇文章"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-ink dark:text-paper text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    post.isPublished
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-ink/20 dark:bg-gray-800 text-ink dark:text-gray-300'
                  }`}
                >
                  {post.isPublished ? '已发布' : '草稿'}
                </span>
              </div>

              {post.excerpt && (
                <p className="text-ink/70 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
              )}

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

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => form.openEdit(post)}
                  className="flex-1 py-2 px-3 bg-ink text-white rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} />
                  编辑
                </button>
                <button
                  onClick={() => form.remove(post.id, '确定要删除这篇文章吗？')}
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

      <AdminEntityModal
        open={form.isModalOpen}
        title={`${form.editingItem ? '编辑文章' : '新建文章'}`}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        size="lg"
      >
        <FormFields fields={formFields} formData={form.formData} onChange={form.setField} />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminPosts;
