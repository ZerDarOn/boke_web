import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Plus, Edit, Trash2, Heart, Star, Filter, Loader2, X, Save, Upload, Image as ImageIcon, XCircle } from 'lucide-react';

interface Anime {
  id: string;
  title: string;
  cover: string;
  type: 'TV' | 'OVA' | 'Movie' | 'Special' | 'ONA';
  episodes: number;
  currentEp: number;
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;
  favorite: boolean;
  genres: string[];
  studios: string[];
  aired?: string;
  startDate?: string;
  finishDate?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminAnime: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorite' | 'not-favorite'>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [formData, setFormData] = useState<Partial<Anime>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');

  useEffect(() => {
    fetchAnime();
  }, [statusFilter, favoriteFilter]);

  const fetchAnime = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (favoriteFilter === 'favorite') {
        params.favorite = true;
      } else if (favoriteFilter === 'not-favorite') {
        params.favorite = false;
      }
      
      const result = await api.anime.getAll(params);
      if (result.success && result.data) {
        setAnimeList(result.data);
      } else {
        setError(result.error || 'Failed to fetch anime');
      }
    } catch (error) {
      console.error('Failed to fetch anime:', error);
      setError('Failed to fetch anime');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除动漫 "${title}" 吗？`)) return;
    
    try {
      await api.anime.delete(id);
      setAnimeList(animeList.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete anime:', error);
      alert('删除失败');
    }
  };

  const handleEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setFormData({ ...anime });
    setCoverPreview(anime.cover || '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAnime(null);
    setFormData({
      title: '',
      type: 'TV',
      episodes: 12,
      currentEp: 0,
      status: 'WATCHING',
      score: undefined,
      favorite: false,
      genres: [],
      studios: [],
      cover: '',
    });
    setCoverPreview('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnime(null);
    setFormData({});
  };

  const handleInputChange = (key: keyof Anime, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAnime) {
        // Update
        const result = await api.anime.update(editingAnime.id, formData);
        if (result.success) {
          setAnimeList(animeList.map(a => a.id === editingAnime.id ? { ...a, ...formData } : a));
          handleCloseModal();
        } else {
          alert('更新失败: ' + result.error);
        }
      } else {
        // Create
        const result = await api.anime.create(formData as any);
        if (result.success && result.data) {
          setAnimeList([result.data, ...animeList]);
          handleCloseModal();
        } else {
          alert('创建失败: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const result = await fetch(`${api.anime.getById(id)}/favorite`, { method: 'POST' });
      setAnimeList(animeList.map(a => a.id === id ? { ...a, favorite: !a.favorite } : a));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('请选择有效的图片文件 (JPG/PNG/GIF/WebP)');
      return;
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', file);

      // 获取认证 token
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/upload/image/anime`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      if (result.success && result.data?.originalUrl) {
        handleInputChange('cover', result.data.originalUrl);
        setCoverPreview(result.data.originalUrl);
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = () => {
    handleInputChange('cover', '');
    setCoverPreview('');
  };

  const getApiBaseUrl = async () => {
    const { API_BASE_URL } = await import('../../lib/apiConfig');
    return API_BASE_URL;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'WATCHING': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'DROPPED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'WATCHING': '观看中',
      'COMPLETED': '已完成',
      'ON_HOLD': '暂停',
      'DROPPED': '放弃',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const filteredAnime = animeList.filter(anime =>
    anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anime.genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
    anime.studios.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-lg">加载动漫列表中...</p>
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
          onClick={fetchAnime}
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ink dark:text-paper">动漫管理</h1>
              <p className="text-ink/70 dark:text-gray-400">共 {animeList.length} 部动漫</p>
            </div>
          </div>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            添加动漫
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">观看中</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {animeList.filter(a => a.status === 'WATCHING').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xl">▶️</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-5 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">已完成</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {animeList.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 dark:from-pink-900/20 dark:to-pink-800/10 rounded-xl p-5 border border-pink-200 dark:border-pink-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">收藏</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {animeList.filter(a => a.favorite).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Heart size={20} className="fill-pink-500 text-pink-500" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">平均评分</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {animeList.filter(a => a.score).length > 0 
                    ? (animeList.filter(a => a.score).reduce((sum, a) => sum + (a.score || 0), 0) / animeList.filter(a => a.score).length).toFixed(1)
                    : '-'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Star size={20} className="fill-yellow-500 text-yellow-500" />
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
                placeholder="搜索动漫标题、类型或制作公司..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-ink/40 dark:text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="WATCHING">观看中</option>
                <option value="COMPLETED">已完成</option>
                <option value="ON_HOLD">暂停</option>
                <option value="DROPPED">放弃</option>
              </select>
            </div>

            {/* Favorite Filter */}
            <select
              value={favoriteFilter}
              onChange={(e) => setFavoriteFilter(e.target.value as any)}
              className="px-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="all">全部收藏</option>
              <option value="favorite">已收藏</option>
              <option value="not-favorite">未收藏</option>
            </select>
          </div>
        </div>

        {/* Edit/Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAnime ? '编辑动漫' : '添加动漫'}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="动漫标题"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        类型
                      </label>
                      <select
                        value={formData.type || 'TV'}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="TV">TV</option>
                        <option value="OVA">OVA</option>
                        <option value="Movie">Movie</option>
                        <option value="Special">Special</option>
                        <option value="ONA">ONA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        状态
                      </label>
                      <select
                        value={formData.status || 'WATCHING'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="WATCHING">观看中</option>
                        <option value="COMPLETED">已完成</option>
                        <option value="ON_HOLD">暂停</option>
                        <option value="DROPPED">放弃</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        总集数
                      </label>
                      <input
                        type="number"
                        value={formData.episodes || ''}
                        onChange={(e) => handleInputChange('episodes', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        当前集数
                      </label>
                      <input
                        type="number"
                        value={formData.currentEp || ''}
                        onChange={(e) => handleInputChange('currentEp', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        评分 (0-10)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.score || ''}
                        onChange={(e) => handleInputChange('score', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="8.5"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="favorite"
                        checked={formData.favorite || false}
                        onChange={(e) => handleInputChange('favorite', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="favorite" className="text-sm font-medium text-gray-700">
                        收藏
                      </label>
                    </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       封面图片
                     </label>
                     <div className="space-y-2">
                       {/* 图片上传区域 */}
                       <div className="flex items-center gap-3">
                         <label className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-lg cursor-pointer transition-colors">
                           <Upload size={18} className="text-gray-600" />
                           <span className="text-sm text-gray-700">
                             {uploading ? '上传中...' : '点击上传图片'}
                           </span>
                           <input
                             type="file"
                             accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                             onChange={handleImageUpload}
                             className="hidden"
                             disabled={uploading}
                           />
                         </label>
                       </div>

                       {/* 图片预览和删除按钮 */}
                       {(formData.cover || coverPreview) && (
                         <div className="relative inline-block">
                           <img
                             src={formData.cover || coverPreview}
                             alt="封面预览"
                             className="w-32 h-48 object-cover rounded-lg border border-gray-300"
                           />
                           <button
                             type="button"
                             onClick={handleRemoveCover}
                             className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                           >
                             <XCircle size={16} />
                           </button>
                         </div>
                       )}

                       {/* 封面链接输入 */}
                       <div className="flex items-center gap-2">
                         <ImageIcon size={18} className="text-gray-600" />
                         <input
                           type="text"
                           value={formData.cover || ''}
                           onChange={(e) => handleInputChange('cover', e.target.value)}
                           className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                           placeholder="或输入封面图片链接..."
                         />
                       </div>
                     </div>
                     <p className="text-xs text-gray-500">
                       支持 JPG/PNG/GIF/WebP，最大 5MB；也可直接输入图片链接
                     </p>
                   </div>

                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      类型标签 (用逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={formData.genres?.join(', ') || ''}
                      onChange={(e) => handleInputChange('genres', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="动作, 科幻, 冒险"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      制作公司 (用逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={formData.studios?.join(', ') || ''}
                      onChange={(e) => handleInputChange('studios', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Studio Ghibli, MAPPA"
                    />
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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

        {/* Anime Grid */}
        {filteredAnime.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnime.map((anime) => (
              <div 
                key={anime.id}
                className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  {anime.cover ? (
                    <img
                      src={anime.cover}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">🎬</span>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(anime.status)}`}>
                      {getStatusText(anime.status)}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => handleToggleFavorite(anime.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                  >
                    <Heart 
                      size={18} 
                      className={anime.favorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} 
                    />
                  </button>

                  {/* Score Badge */}
                  {anime.score && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-yellow-400 font-bold text-sm flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      {anime.score.toFixed(1)}
                    </div>
                  )}

                  {/* Episode Progress */}
                  <div className="absolute bottom-3 left-3">
                    <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm">
                      {anime.currentEp} / {anime.episodes} 集
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-ink dark:text-paper text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {anime.title}
                  </h3>

                  {/* Meta */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-ink/70 dark:text-gray-400">
                      <span className="px-2 py-1 bg-ink/5 dark:bg-black/20 rounded-md">
                        {anime.type}
                      </span>
                      <span>·</span>
                      <span>{anime.studios.join(', ')}</span>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1.5">
                      {anime.genres.slice(0, 3).map((genre, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                      {anime.genres.length > 3 && (
                        <span className="px-2 py-1 bg-ink/5 dark:bg-black/20 text-ink/70 dark:text-gray-400 rounded-md text-xs">
                          +{anime.genres.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => handleEdit(anime)}
                      className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <Edit size={14} />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(anime.id, anime.title)}
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
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">
              {searchTerm ? '未找到匹配的动漫' : '暂无动漫'}
            </h3>
            <p className="text-ink/70 dark:text-gray-400 mb-6">
              {searchTerm ? '尝试其他搜索关键词' : '点击右上角按钮添加第一部动漫'}
            </p>
            <button 
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2 font-medium mx-auto"
            >
              <Plus size={18} />
              添加动漫
            </button>
          </div>
        )}
      </div>
    );
};

export default AdminAnime;
