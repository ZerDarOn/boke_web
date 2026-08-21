/**
 * 音乐馆配置
 * ============================================================================
 * 关联在线音乐歌单：APlayer 播放器 + 公共 Meting API 取播放地址。
 * 支持网易云 / QQ / 酷狗 等多个音源、多个歌单，歌单清单在后台「音乐管理」里维护，
 * 存到 SiteConfig 的 `music_sources` 键（JSON 数组），无需改代码、无需重新构建。
 *
 * 本文件只保留：音源/类型常量、Meting API 地址、后台未配置时的回退歌单。
 *
 * 【关于稳定性】
 * Meting API 是第三方公共服务，用于绕过版权外链限制取得播放地址。
 * 该服务可能限流或失效；部分有版权的歌曲可能取不到播放地址。
 * 若默认服务不可用，可把 METING_API_BASE 换成其它公开的 Meting 部署。
 * ============================================================================
 */

/** Meting 支持的音源 */
export type MusicServer = 'netease' | 'tencent' | 'kugou' | 'xiami' | 'baidu';

/** 资源类型 */
export type MusicSourceType = 'playlist' | 'song' | 'album' | 'artist';

/** 一个歌单源（后台一行 = 一个） */
export interface MusicSource {
  id: string; // 前端生成的唯一行 ID
  name: string; // 歌单显示名（前台切换标签的文字），如「古风」
  server: MusicServer; // 音源
  type: MusicSourceType; // 资源类型
  sourceId: string; // 歌单/单曲/专辑/歌手 ID
  enabled: boolean; // 是否在前台显示
  category?: string; // 前台筛选分组，如「通勤」「夜晚」
  description?: string; // 歌单说明
  pinned?: boolean; // 是否优先展示
  order?: number; // 同一优先级下的手动排序
}

/** 后台音源下拉选项 */
export const MUSIC_SERVERS: { value: MusicServer; label: string }[] = [
  { value: 'netease', label: '网易云音乐' },
  { value: 'tencent', label: 'QQ 音乐' },
  { value: 'kugou', label: '酷狗音乐' },
  { value: 'xiami', label: '虾米音乐' },
  { value: 'baidu', label: '百度音乐' },
];

/** 后台资源类型下拉选项 */
export const MUSIC_SOURCE_TYPES: { value: MusicSourceType; label: string }[] = [
  { value: 'playlist', label: '歌单' },
  { value: 'song', label: '单曲' },
  { value: 'album', label: '专辑' },
  { value: 'artist', label: '歌手' },
];

// 第三方 Meting API 地址（用于获取歌曲的可播放地址）
// 备选: https://meting-api-omega.vercel.app/  |  https://api.injahow.cn/meting/
export const METING_API_BASE = 'https://api.qijieya.cn/meting/';

// 缓存版本号，修改后递增以强制刷新 APlayer 的 localStorage 进度缓存
export const MUSIC_CACHE_VERSION = '2';

// 默认网易云歌单 ID（后台一条都没配置时的回退）
const DEFAULT_PLAYLIST_ID = '2619366284';

/** 后台未配置时使用的回退歌单清单 */
export const DEFAULT_MUSIC_SOURCES: MusicSource[] = [
  {
    id: 'default',
    name: '默认歌单',
    server: 'netease',
    type: 'playlist',
    sourceId: DEFAULT_PLAYLIST_ID,
    enabled: true,
  },
];
