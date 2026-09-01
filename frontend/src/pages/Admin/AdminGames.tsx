import React, { useMemo, useState } from 'react';
import {
  useGameList,
  useCreateGame,
  useUpdateGame,
  useDeleteGame,
} from '../../hooks/queries/games';
import { type Game } from '../../lib/api/games';
import { Heart, Star, Gamepad2, Clock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { gamesApi } from '../../lib/api/games';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  CardActions,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

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

const STATUS_COLORS: Record<string, string> = {
  WANT_TO_PLAY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  PLAYING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  DROPPED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  REPLAYING: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
};

const STATUS_TEXTS: Record<string, string> = {
  WANT_TO_PLAY: '想玩',
  PLAYING: '游玩中',
  COMPLETED: '已完成',
  DROPPED: '放弃',
  REPLAYING: '重玩中',
};

const FORM_FIELDS: FieldConfig[] = [
  { key: 'title', label: '标题', type: 'text', required: true, colSpan: 2, placeholder: '游戏标题' },
  { key: 'platform', label: '平台', type: 'select', options: PLATFORM_OPTIONS },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { key: 'platformId', label: '平台 ID', type: 'text', placeholder: 'Steam App ID 等' },
  { key: 'storeUrl', label: '商店链接', type: 'text', placeholder: 'https://store.steampowered.com/...' },
  { key: 'developer', label: '开发商', type: 'text', placeholder: '开发商名称' },
  { key: 'publisher', label: '发行商', type: 'text', placeholder: '发行商名称' },
  { key: 'releaseDate', label: '发行日期', type: 'date' },
  { key: 'playtime', label: '游玩时间 (分钟)', type: 'number', min: 0, placeholder: '0' },
  { key: 'score', label: '评分 (0-10)', type: 'number', min: 0, max: 10, step: 0.1, placeholder: '8.5' },
  { key: 'favorite', label: '收藏', type: 'checkbox', placeholder: '收藏' },
  { key: 'isHidden', label: '隐藏', type: 'checkbox', placeholder: '隐藏' },
  { key: 'achievementsTotal', label: '成就总数', type: 'number', min: 0, placeholder: '0' },
  { key: 'achievementsUnlocked', label: '已解锁成就', type: 'number', min: 0, placeholder: '0' },
  {
    key: 'cover',
    label: '封面图片',
    type: 'image',
    colSpan: 2,
    uploadType: 'game',
    previewClassName: 'w-32 h-20',
    hint: '支持 JPG/PNG/GIF/WebP，最大 5MB；也可直接输入图片链接',
  },
  { key: 'bannerImage', label: '横幅图片 URL', type: 'text', colSpan: 2, placeholder: '横幅图片链接' },
  {
    key: 'screenshots',
    label: '精彩截图（每行一张图片链接）',
    type: 'lines',
    colSpan: 2,
    rows: 4,
    placeholder: 'https://example.com/highlight-1.jpg\nhttps://example.com/highlight-2.jpg',
    hint: '前台详情会以可点击的画廊展示这些截图。',
  },
  { key: 'highlights', label: '精彩时刻', type: 'highlights', colSpan: 2 },
  { key: 'genres', label: '类型标签', type: 'array', placeholder: 'RPG, 动作, 开放世界' },
  { key: 'tags', label: '标签', type: 'array', placeholder: '独立游戏, 像素风, 多人合作' },
  { key: 'description', label: '描述', type: 'textarea', rows: 3, colSpan: 2, placeholder: '游戏简介...' },
  { key: 'notes', label: '备注', type: 'textarea', rows: 3, colSpan: 2, placeholder: '个人游玩备注...' },
  {
    key: 'hideReason',
    label: '隐藏原因',
    type: 'text',
    colSpan: 2,
    placeholder: '隐藏此游戏的原因',
    visible: (form) => form.isHidden === true,
  },
];

const CREATE_DEFAULTS = {
  title: '',
  cover: '',
  bannerImage: '',
  screenshots: [],
  highlights: [],
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
};

const formatPlaytime = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
};

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

  const { data: gameList = [], isLoading: loading, error: queryError, refetch } = useGameList(
    listParams as Parameters<typeof useGameList>[0],
  );
  const error = queryError?.message ?? null;
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  const form = useEntityForm<Game>({
    createMutation: createGame,
    updateMutation: updateGame,
    deleteMutation: deleteGame,
    defaults: CREATE_DEFAULTS,
  });

  const handleSyncSteam = async () => {
    if (syncing) return;
    if (
      !(await confirm({
        title: '同步 Steam 游戏库',
        message: '将从 Steam 拉取你的游戏库。新游戏默认隐藏（需在此页面手动取消隐藏后才会在前台展示），已有游戏仅更新游玩时长，不会覆盖你的手动修改。',
        danger: false,
        confirmText: '开始同步',
      }))
    )
      return;

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

  const handleToggleFavorite = async (id: string) => {
    const item = gameList.find((g) => g.id === id);
    if (!item) return;
    try {
      await updateGame.mutateAsync({ id, data: { favorite: !item.favorite } });
    } catch {
      console.error('Failed to toggle favorite');
    }
  };

  const handleToggleHidden = async (id: string) => {
    const item = gameList.find((g) => g.id === id);
    if (!item) return;
    try {
      await updateGame.mutateAsync({ id, data: { isHidden: !item.isHidden } });
      toast.success(item.isHidden ? '已显示到前台' : '已隐藏');
    } catch {
      toast.error('操作失败');
    }
  };

  const filteredGames = gameList.filter(
    (game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.genres?.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
      game.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalPlaytime = gameList.reduce((sum, g) => sum + (g.playtime || 0), 0);
  const stats: StatConfig[] = [
    {
      label: '游玩中',
      value: gameList.filter((g) => g.status === 'PLAYING').length,
      icon: <Gamepad2 size={20} />,
      tone: 'blue',
    },
    {
      label: '已完成',
      value: gameList.filter((g) => g.status === 'COMPLETED').length,
      icon: <span className="text-xl">✅</span>,
      tone: 'green',
    },
    {
      label: '收藏',
      value: gameList.filter((g) => g.favorite).length,
      icon: <Heart size={20} className="fill-pink-500 text-pink-500" />,
      tone: 'pink',
    },
    {
      label: '总游玩时间',
      value: totalPlaytime >= 60 ? `${Math.round(totalPlaytime / 60)}h` : `${totalPlaytime}m`,
      icon: <Clock size={20} />,
      tone: 'yellow',
    },
  ];

  return (
    <AdminPageShell
      title="游戏管理"
      icon={<Gamepad2 className="text-cyan-500" size={24} />}
      accent="cyan"
      iconClassName="bg-gradient-to-br from-cyan-500/20 to-emerald-500/20"
      count={gameList.length}
      countLabel="款游戏"
      createLabel="添加游戏"
      onCreate={form.openCreate}
      headerActions={
        <button
          onClick={handleSyncSteam}
          disabled={syncing}
          className="px-5 py-3 bg-[#1b2838] text-white rounded-xl hover:bg-[#2a475e] transition-all shadow-lg flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          title="从 Steam 拉取游戏库"
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '同步中...' : '同步 Steam'}
        </button>
      }
      loading={loading}
      loadingText="加载游戏列表中..."
      error={error}
      onRetry={refetch}
      stats={stats}
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: '搜索游戏标题、类型、开发商或标签...',
      }}
      filters={
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="all">全部状态</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="all">全部平台</option>
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
          <select
            value={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.value as typeof favoriteFilter)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="all">全部收藏</option>
            <option value="favorite">已收藏</option>
            <option value="not-favorite">未收藏</option>
          </select>
        </>
      }
      isEmpty={filteredGames.length === 0}
      emptyEmoji="🎮"
      emptyTitle={searchTerm ? '未找到匹配的游戏' : '暂无游戏'}
      emptyActionLabel="添加第一款游戏"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className="group bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            {/* 封面 */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-900/20 dark:to-emerald-900/20">
              {game.bannerImage || game.cover ? (
                <img
                  src={game.bannerImage || game.cover}
                  alt={game.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="opacity-30" size={48} />
                </div>
              )}

              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[game.status] || 'bg-gray-100 text-gray-800'}`}>
                  {STATUS_TEXTS[game.status] || game.status}
                </span>
              </div>

              <button
                onClick={() => handleToggleFavorite(game.id)}
                title={game.favorite ? '取消收藏' : '收藏'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
              >
                <Heart size={18} className={game.favorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} />
              </button>

              <button
                onClick={() => handleToggleHidden(game.id)}
                title={game.isHidden ? '点击在前台显示' : '点击隐藏'}
                className="absolute top-3 right-14 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
              >
                {game.isHidden ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-emerald-500" />}
              </button>

              {game.score != null && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-yellow-400 font-bold text-sm flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {game.score.toFixed(1)}
                </div>
              )}

              {game.playtime > 0 && (
                <div className="absolute bottom-3 left-3">
                  <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm flex items-center gap-1">
                    <Clock size={12} />
                    {formatPlaytime(game.playtime)}
                  </div>
                </div>
              )}

              {game.isHidden && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.5 rounded bg-gray-800/80 text-gray-300 text-xs flex items-center gap-1">
                    <EyeOff size={10} />
                    已隐藏
                  </span>
                </div>
              )}
            </div>

            {/* 内容 */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {game.title}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-black/20 rounded-md">{game.platform}</span>
                  {game.developer && (
                    <>
                      <span>·</span>
                      <span className="truncate">{game.developer}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {game.genres?.slice(0, 3).map((genre, idx) => (
                    <span key={idx} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md text-xs">
                      {genre}
                    </span>
                  ))}
                  {(game.genres?.length ?? 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-black/20 text-gray-600 dark:text-gray-400 rounded-md text-xs">
                      +{game.genres.length - 3}
                    </span>
                  )}
                </div>

                {game.achievementsTotal > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (game.achievementsUnlocked / game.achievementsTotal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {game.achievementsUnlocked}/{game.achievementsTotal}
                    </span>
                  </div>
                )}
              </div>

              <CardActions
                accent="cyan"
                editLabel="编辑"
                deleteLabel="删除"
                onEdit={() => form.openEdit(game)}
                onDelete={() => form.remove(game.id, `确定要删除游戏 "${game.title}" 吗？`)}
              />
            </div>
          </div>
        ))}
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={form.editingItem ? '编辑游戏' : '添加游戏'}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        accent="cyan"
        size="lg"
      >
        <FormFields fields={FORM_FIELDS} formData={form.formData} onChange={form.setField} accent="cyan" />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminGames;
