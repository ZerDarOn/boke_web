import React, { useState, useMemo } from 'react';
import {
  useGameList,
  useCreateGame,
  useUpdateGame,
  useDeleteGame,
} from '../../hooks/queries/games';
import { type Game } from '../../lib/api/games';
import { Search, Plus, Edit, Trash2, Heart, Star, Filter, Loader2, X, Save, Upload, Image as ImageIcon, XCircle, Gamepad2, Clock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../lib/apiConfig';
import { getAuthHeaders } from '../../lib/api/request';
import { gamesApi } from '../../lib/api/games';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const PLATFORM_OPTIONS = [
  { value: 'STEAM', label: 'Steam' },
  { value: 'EPIC', label: 'Epic Games' },
  { value: 'GOG', label: 'GOG' },
  { value: 'ITCH', label: 'itch.io' },
  { value: 'NINTENDO_SWITCH', label: 'Nintendo Switch' },
  { value: 'PLAYSTATION', label: 'PlayStation' },
  { value: 'XBOX', label: 'Xbox' },
  { value: 'OTHER', label: '其他' },
];

const STATUS_OPTIONS = [
  { value: 'WANT_TO_PLAY', label: '想玩' },
  { value: 'PLAYING', label: '游玩中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'DROPPED', label: '放弃' },
  { value: 'REPLAYING', label: '重玩中' },
];

const AdminGames: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorite' | 'not-favorite'>('all');

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = { includeHidden: true, limit: 500 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (platformFilter !== 'all') params.platform = platformFilter;
    if (favoriteFilter === 'favorite') params.favorite = true;
    if (favoriteFilter === 'not-favorite') params.favorite = false;
    return params;
  }, [statusFilter, platformFilter, favoriteFilter]);

  const { data: gameList = [], isLoading: loading, error: queryError, refetch } = useGameList(listParams as Parameters<typeof useGameList>[0]);
  const error = queryError?.message ?? null;
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState<Partial<Game>>({});
  const isSubmitting = createGame.isPending || updateGame.isPending;

  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');

  const handleDelete = async (id: string, title: string) => {
    if (!(await confirm({ message: `确定要删除游戏 "${title}" 吗？` }))) return;

    try {
      await deleteGame.mutateAsync(id);
      toast.success('删除成功');
    } catch (error) {
      console.error('Failed to delete game:', error);
      toast.error('删除失败');
    }
  };

  const handleSyncSteam = async () => {
    if (syncing) return;
    if (!(await confirm({
      title: '同步 Steam 游戏库',
      message: '将从 Steam 拉取你的游戏库。新游戏默认隐藏（需在此页面手动取消隐藏后才会在前台展示），已有游戏仅更新游玩时长，不会覆盖你的手动修改。',
      danger: false,
      confirmText: '开始同步',
    }))) return;

    setSyncing(true);
    try {
      const res = await gamesApi.syncSteam();
      if (res.success && res.data) {
        const { created, updated, total } = res.data;
        toast.success('同步完成', `共 ${total} 个游戏：新增 ${created}，更新 ${updated}`);
        await refetch();
      } else {
        toast.error('同步失败', res.error || '请检查后端 Steam 配置');
      }
    } catch (e) {
      toast.error('同步失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setFormData({ ...game });
    setCoverPreview(game.cover || '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingGame(null);
    setFormData({
      title: '',
      cover: '',
      bannerImage: '',
      screenshots: [],
      platform: 'STEAM',
      platformId: '',
      storeUrl: '',
      genres: [],
      developer: '',
      publisher: '',
      releaseDate: '',
      description: '',
      status: 'WANT_TO_PLAY',
      playtime: 0,
      score: undefined,
      favorite: false,
      notes: '',
      tags: [],
      achievementsTotal: 0,
      achievementsUnlocked: 0,
      isHidden: false,
      hideReason: '',
    });
    setCoverPreview('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
    setFormData({});
  };

  const handleInputChange = (key: keyof Game, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        await updateGame.mutateAsync({ id: editingGame.id, data: formData });
      } else {
        await createGame.mutateAsync(formData);
      }
      handleCloseModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(editingGame ? `更新失败: ${message}` : `创建失败: ${message}`);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const item = (gameList as Game[]).find((g) => g.id === id);
    if (!item) return;
    try {
      await updateGame.mutateAsync({ id, data: { favorite: !item.favorite } });
    } catch {
      console.error('Failed to toggle favorite');
    }
  };

  const handleToggleHidden = async (id: string) => {
    const item = (gameList as Game[]).find((g) => g.id === id);
    if (!item) return;
    try {
      await updateGame.mutateAsync({ id, data: { isHidden: !item.isHidden } });
      toast.success(item.isHidden ? '已显示到前台' : '已隐藏');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.warning('请选择有效的图片文件 (JPG/PNG/GIF/WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/image/game`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: uploadFormData,
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
      toast.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = () => {
    handleInputChange('cover', '');
    setCoverPreview('');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'WANT_TO_PLAY': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'PLAYING': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'DROPPED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      'REPLAYING': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'WANT_TO_PLAY': '想玩',
      'PLAYING': '游玩中',
      'COMPLETED': '已完成',
      'DROPPED': '放弃',
      'REPLAYING': '重玩中',
    };
    return texts[status] || status;
  };

  const formatPlaytime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  };

  const filteredGames = (gameList as Game[]).filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.genres?.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
    game.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-lg">加载游戏列表中...</p>
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

  const games = gameList as Game[];
  const totalPlaytime = games.reduce((sum, g) => sum + (g.playtime || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
            <Gamepad2 className="text-cyan-500" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-paper">游戏管理</h1>
            <p className="text-ink/70 dark:text-gray-400">共 {games.length} 款游戏</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncSteam}
            disabled={syncing}
            className="px-5 py-3 bg-[#1b2838] text-white rounded-xl hover:bg-[#2a475e] transition-all shadow-lg flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            title="从 Steam 拉取游戏库"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '同步中...' : '同步 Steam'}
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl hover:from-cyan-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            添加游戏
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">游玩中</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {games.filter(g => g.status === 'PLAYING').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Gamepad2 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-5 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">已完成</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {games.filter(g => g.status === 'COMPLETED').length}
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
                {games.filter(g => g.favorite).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <Heart size={20} className="fill-pink-500 text-pink-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/5 dark:from-yellow-900/20 dark:to-orange-800/10 rounded-xl p-5 border border-yellow-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70 dark:text-gray-400 mb-1">总游玩时间</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {totalPlaytime >= 60 ? `${Math.round(totalPlaytime / 60)}h` : `${totalPlaytime}m`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
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
              placeholder="搜索游戏标题、类型、开发商或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-ink/40 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="all">全部状态</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="all">全部平台</option>
            {PLATFORM_OPTIONS.map(platform => (
              <option key={platform.value} value={platform.value}>{platform.label}</option>
            ))}
          </select>

          {/* Favorite Filter */}
          <select
            value={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.value as any)}
            className="px-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all cursor-pointer"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGame ? '编辑游戏' : '添加游戏'}
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="游戏标题"
                    required
                  />
                </div>

                {/* Platform & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      平台
                    </label>
                    <select
                      value={formData.platform || 'STEAM'}
                      onChange={(e) => handleInputChange('platform', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {PLATFORM_OPTIONS.map(platform => (
                        <option key={platform.value} value={platform.value}>{platform.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <select
                      value={formData.status || 'WANT_TO_PLAY'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PlatformId & StoreUrl */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      平台 ID
                    </label>
                    <input
                      type="text"
                      value={formData.platformId || ''}
                      onChange={(e) => handleInputChange('platformId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Steam App ID 等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商店链接
                    </label>
                    <input
                      type="text"
                      value={formData.storeUrl || ''}
                      onChange={(e) => handleInputChange('storeUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="https://store.steampowered.com/..."
                    />
                  </div>
                </div>

                {/* Developer & Publisher */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开发商
                    </label>
                    <input
                      type="text"
                      value={formData.developer || ''}
                      onChange={(e) => handleInputChange('developer', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="开发商名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      发行商
                    </label>
                    <input
                      type="text"
                      value={formData.publisher || ''}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="发行商名称"
                    />
                  </div>
                </div>

                {/* ReleaseDate & Playtime */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      发行日期
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate || ''}
                      onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      游玩时间 (分钟)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.playtime ?? ''}
                      onChange={(e) => handleInputChange('playtime', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Score & Favorite */}
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
                      value={formData.score ?? ''}
                      onChange={(e) => handleInputChange('score', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="8.5"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.favorite || false}
                        onChange={(e) => handleInputChange('favorite', e.target.checked)}
                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-gray-700">收藏</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHidden || false}
                        onChange={(e) => handleInputChange('isHidden', e.target.checked)}
                        className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm font-medium text-gray-700">隐藏</span>
                    </label>
                  </div>
                </div>

                {/* Achievements */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      成就总数
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.achievementsTotal ?? ''}
                      onChange={(e) => handleInputChange('achievementsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      已解锁成就
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.achievementsUnlocked ?? ''}
                      onChange={(e) => handleInputChange('achievementsUnlocked', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    封面图片
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-cyan-500 rounded-lg cursor-pointer transition-colors">
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

                    {(formData.cover || coverPreview) && (
                      <div className="relative inline-block">
                        <img
                          src={formData.cover || coverPreview}
                          alt="封面预览"
                          className="w-32 h-18 object-cover rounded-lg border border-gray-300"
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

                    <div className="flex items-center gap-2">
                      <ImageIcon size={18} className="text-gray-600" />
                      <input
                        type="text"
                        value={formData.cover || ''}
                        onChange={(e) => handleInputChange('cover', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="或输入封面图片链接..."
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    支持 JPG/PNG/GIF/WebP，最大 5MB；也可直接输入图片链接
                  </p>
                </div>

                {/* Banner Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    横幅图片 URL
                  </label>
                  <input
                    type="text"
                    value={formData.bannerImage || ''}
                    onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="横幅图片链接"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    精彩截图（每行一张图片链接）
                  </label>
                  <textarea
                    value={formData.screenshots?.join('\n') || ''}
                    onChange={(e) => handleInputChange('screenshots', e.target.value.split('\n').map((url) => url.trim()).filter(Boolean))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder={'https://example.com/highlight-1.jpg\nhttps://example.com/highlight-2.jpg'}
                  />
                  <p className="mt-1 text-xs text-gray-500">前台详情会以可点击的画廊展示这些截图。</p>
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型标签 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.genres?.join(', ') || ''}
                    onChange={(e) => handleInputChange('genres', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="RPG, 动作, 开放世界"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标签 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="独立游戏, 像素风, 多人合作"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="游戏简介..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="个人游玩备注..."
                  />
                </div>

                {/* Hide Reason */}
                {formData.isHidden && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      隐藏原因
                    </label>
                    <input
                      type="text"
                      value={formData.hideReason || ''}
                      onChange={(e) => handleInputChange('hideReason', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="隐藏此游戏的原因"
                    />
                  </div>
                )}
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
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-lg hover:from-cyan-700 hover:to-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-900/20 dark:to-emerald-900/20">
                {(game.bannerImage || game.cover) ? (
                  <img
                    src={game.bannerImage || game.cover}
                    alt={game.title}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="text-6xl opacity-30" size={48} />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                    {getStatusText(game.status)}
                  </span>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite(game.id)}
                  title={game.favorite ? '取消收藏' : '收藏'}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                >
                  <Heart
                    size={18}
                    className={game.favorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}
                  />
                </button>

                {/* Show/Hide Button */}
                <button
                  onClick={() => handleToggleHidden(game.id)}
                  title={game.isHidden ? '点击在前台显示' : '点击隐藏'}
                  className="absolute top-3 right-14 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                >
                  {game.isHidden
                    ? <EyeOff size={18} className="text-gray-400" />
                    : <Eye size={18} className="text-emerald-500" />}
                </button>

                {/* Score Badge */}
                {game.score != null && (
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-yellow-400 font-bold text-sm flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    {game.score.toFixed(1)}
                  </div>
                )}

                {/* Playtime Badge */}
                {game.playtime > 0 && (
                  <div className="absolute bottom-3 left-3">
                    <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm flex items-center gap-1">
                      <Clock size={12} />
                      {formatPlaytime(game.playtime)}
                    </div>
                  </div>
                )}

                {/* Hidden indicator */}
                {game.isHidden && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 rounded bg-gray-800/80 text-gray-300 text-xs flex items-center gap-1">
                      <EyeOff size={10} />
                      已隐藏
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-ink dark:text-paper text-lg mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {game.title}
                </h3>

                {/* Meta */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-ink/70 dark:text-gray-400">
                    <span className="px-2 py-1 bg-ink/5 dark:bg-black/20 rounded-md">
                      {game.platform}
                    </span>
                    {game.developer && (
                      <>
                        <span>·</span>
                        <span className="truncate">{game.developer}</span>
                      </>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres?.slice(0, 3).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                    {(game.genres?.length ?? 0) > 3 && (
                      <span className="px-2 py-1 bg-ink/5 dark:bg-black/20 text-ink/70 dark:text-gray-400 rounded-md text-xs">
                        +{game.genres.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Achievements Progress */}
                  {game.achievementsTotal > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (game.achievementsUnlocked / game.achievementsTotal) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink/60 dark:text-gray-500">
                        {game.achievementsUnlocked}/{game.achievementsTotal}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(game)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-lg hover:from-cyan-700 hover:to-emerald-700 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(game.id, game.title)}
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
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">
            {searchTerm ? '未找到匹配的游戏' : '暂无游戏'}
          </h3>
          <p className="text-ink/70 dark:text-gray-400 mb-6">
            {searchTerm ? '尝试其他搜索关键词' : '点击右上角按钮添加第一款游戏'}
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl hover:from-cyan-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 font-medium mx-auto"
          >
            <Plus size={18} />
            添加游戏
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminGames;
