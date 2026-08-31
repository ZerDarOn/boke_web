import React, { useMemo, useState } from 'react';
import { type Anime } from '../../lib/api/anime';
import {
  useAnimeList,
  useCreateAnime,
  useUpdateAnime,
  useDeleteAnime,
} from '../../hooks/queries/anime';
import { Heart, Star } from 'lucide-react';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  CardActions,
  useEntityForm,
  type FieldConfig,
  type StatConfig,
} from './crud';

const STATUS_COLORS: Record<string, string> = {
  WATCHING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  DROPPED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const STATUS_TEXTS: Record<string, string> = {
  WATCHING: '观看中',
  COMPLETED: '已完成',
  ON_HOLD: '暂停',
  DROPPED: '放弃',
};

const STATUS_OPTIONS = [
  { value: 'WATCHING', label: '观看中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ON_HOLD', label: '暂停' },
  { value: 'DROPPED', label: '放弃' },
];

const TYPE_OPTIONS = ['TV', 'OVA', 'Movie', 'Special', 'ONA'];

const FORM_FIELDS: FieldConfig[] = [
  { key: 'title', label: '标题', type: 'text', required: true, colSpan: 2, placeholder: '动漫标题' },
  { key: 'type', label: '类型', type: 'select', options: TYPE_OPTIONS },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { key: 'episodes', label: '总集数', type: 'number', placeholder: '12' },
  { key: 'currentEp', label: '当前集数', type: 'number', placeholder: '0' },
  { key: 'score', label: '评分 (0-10)', type: 'number', min: 0, max: 10, step: 0.1, placeholder: '8.5' },
  { key: 'favorite', label: '收藏', type: 'checkbox', placeholder: '收藏' },
  {
    key: 'cover',
    label: '封面图片',
    type: 'image',
    colSpan: 2,
    uploadType: 'anime',
    previewClassName: 'w-32 h-48',
    hint: '支持 JPG/PNG/GIF/WebP，最大 5MB；也可直接输入图片链接',
  },
  { key: 'genres', label: '类型标签', type: 'array', placeholder: '动作, 科幻, 冒险' },
  { key: 'studios', label: '制作公司', type: 'array', placeholder: 'Studio Ghibli, MAPPA' },
  { key: 'aired', label: '放送信息', type: 'text', placeholder: '2026-04 至 2026-06' },
  { key: 'tags', label: '我的标签', type: 'array', placeholder: '作画惊艳, 适合周末, 待二刷' },
  { key: 'synopsis', label: '剧情简介', type: 'textarea', rows: 4, colSpan: 2, placeholder: '用自己的话记录这部作品讲了什么…' },
  { key: 'notes', label: '我的点评', type: 'textarea', rows: 4, colSpan: 2, placeholder: '值得记住的镜头、感受或推荐理由…' },
  { key: 'highlights', label: '精彩时刻', type: 'highlights', colSpan: 2 },
  {
    key: 'bilibiliUrl',
    label: 'bilibili 链接（观看跳转）',
    type: 'text',
    colSpan: 2,
    placeholder: 'https://www.bilibili.com/bangumi/play/ss...',
  },
];

const CREATE_DEFAULTS = {
  title: '',
  type: 'TV',
  episodes: 12,
  currentEp: 0,
  status: 'WATCHING',
  score: undefined,
  favorite: false,
  genres: [],
  studios: [],
  aired: '',
  synopsis: '',
  notes: '',
  tags: [],
  highlights: [],
  cover: '',
};

const AdminAnime: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED'>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorite' | 'not-favorite'>('all');

  const listParams = useMemo(() => {
    const params: { limit: number; status?: string; favorite?: boolean } = { limit: 500 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (favoriteFilter === 'favorite') params.favorite = true;
    if (favoriteFilter === 'not-favorite') params.favorite = false;
    return params;
  }, [statusFilter, favoriteFilter]);

  const { data: animeList = [], isLoading: loading, error: queryError, refetch } = useAnimeList(listParams);
  const error = queryError?.message ?? null;
  const createAnime = useCreateAnime();
  const updateAnime = useUpdateAnime();
  const deleteAnime = useDeleteAnime();

  const form = useEntityForm<Anime>({
    createMutation: createAnime,
    updateMutation: updateAnime,
    deleteMutation: deleteAnime,
    defaults: CREATE_DEFAULTS,
  });

  const handleToggleFavorite = async (id: string) => {
    const item = animeList.find((a) => a.id === id);
    if (!item) return;
    try {
      await updateAnime.mutateAsync({ id, data: { favorite: !item.favorite } });
    } catch {
      console.error('Failed to toggle favorite');
    }
  };

  const filteredAnime = animeList.filter(
    (anime) =>
      anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anime.genres.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
      anime.studios.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const scored = animeList.filter((a) => a.score);
  const stats: StatConfig[] = [
    {
      label: '观看中',
      value: animeList.filter((a) => a.status === 'WATCHING').length,
      icon: <span className="text-xl">▶️</span>,
      tone: 'blue',
    },
    {
      label: '已完成',
      value: animeList.filter((a) => a.status === 'COMPLETED').length,
      icon: <span className="text-xl">✅</span>,
      tone: 'green',
    },
    {
      label: '收藏',
      value: animeList.filter((a) => a.favorite).length,
      icon: <Heart size={20} className="fill-pink-500 text-pink-500" />,
      tone: 'pink',
    },
    {
      label: '平均评分',
      value: scored.length > 0 ? (scored.reduce((sum, a) => sum + (a.score || 0), 0) / scored.length).toFixed(1) : '-',
      icon: <Star size={20} className="fill-yellow-500 text-yellow-500" />,
      tone: 'yellow',
    },
  ];

  return (
    <AdminPageShell
      title="动漫管理"
      icon={<span className="text-2xl">🎬</span>}
      iconClassName="bg-gradient-to-br from-purple-500/20 to-pink-500/20"
      count={animeList.length}
      countLabel="部动漫"
      createLabel="添加动漫"
      onCreate={form.openCreate}
      loading={loading}
      loadingText="加载动漫列表中..."
      error={error}
      onRetry={refetch}
      stats={stats}
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: '搜索动漫标题、类型或制作公司...',
      }}
      filters={
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
          >
            <option value="all">全部状态</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.value as typeof favoriteFilter)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
          >
            <option value="all">全部收藏</option>
            <option value="favorite">已收藏</option>
            <option value="not-favorite">未收藏</option>
          </select>
        </>
      }
      isEmpty={filteredAnime.length === 0}
      emptyEmoji="📺"
      emptyTitle={searchTerm ? '未找到匹配的动漫' : '暂无动漫'}
      emptyActionLabel="添加第一部动漫"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAnime.map((anime) => (
          <div
            key={anime.id}
            className="group bg-white dark:bg-black/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            {/* 封面 */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
              {anime.cover ? (
                <img src={anime.cover} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-30">🎬</span>
                </div>
              )}

              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[anime.status] || 'bg-gray-100 text-gray-800'}`}>
                  {STATUS_TEXTS[anime.status] || anime.status}
                </span>
              </div>

              <button
                onClick={() => handleToggleFavorite(anime.id)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all"
              >
                <Heart size={18} className={anime.favorite ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} />
              </button>

              {anime.score && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-yellow-400 font-bold text-sm flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {anime.score.toFixed(1)}
                </div>
              )}

              <div className="absolute bottom-3 left-3">
                <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm">
                  {anime.currentEp} / {anime.episodes} 集
                </div>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {anime.title}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-black/20 rounded-md">{anime.type}</span>
                  <span>·</span>
                  <span>{anime.studios.join(', ')}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.slice(0, 3).map((genre, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs">
                      {genre}
                    </span>
                  ))}
                  {anime.genres.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-black/20 text-gray-600 dark:text-gray-400 rounded-md text-xs">
                      +{anime.genres.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <CardActions
                editClassName="bg-purple-600 hover:bg-purple-700"
                editLabel="编辑"
                deleteLabel="删除"
                onEdit={() => form.openEdit(anime)}
                onDelete={() => form.remove(anime.id, `确定要删除动漫 "${anime.title}" 吗？`)}
              />
            </div>
          </div>
        ))}
      </div>

      <AdminEntityModal
        open={form.isModalOpen}
        title={form.editingItem ? '编辑动漫' : '添加动漫'}
        onClose={form.closeModal}
        onSubmit={form.submit}
        submitting={form.isSubmitting}
        size="md"
      >
        <FormFields fields={FORM_FIELDS} formData={form.formData} onChange={form.setField} accent="purple" />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminAnime;
