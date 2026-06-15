/**
 * 音乐馆配置
 * ============================================================================
 * 关联网易云音乐歌单的方式：APlayer 播放器 + 公共 Meting API 取播放地址。
 *
 * 【如何换成你自己的歌单】
 * 1. 打开你的网易云歌单网页版，地址形如：
 *    https://music.163.com/#/playlist?id=123456789
 *    其中 123456789 就是 NETEASE_PLAYLIST_ID。
 * 2. 把下面的 NETEASE_PLAYLIST_ID 改成你的歌单 ID 即可。
 *    （也可以在浏览器控制台执行 localStorage.setItem('music_playlist_id','你的ID')
 *      临时覆盖，无需改代码。）
 *
 * 【关于稳定性】
 * Meting API 是第三方公共服务，用于绕过网易云的版权外链限制取得播放地址。
 * 该服务可能限流或失效；部分有版权的歌曲可能取不到播放地址。
 * 若默认服务不可用，可把 METING_API_BASE 换成其它公开的 Meting 部署。
 * ============================================================================
 */

// 你的网易云歌单 ID（默认填一个示例歌单，请替换为自己的）
const DEFAULT_PLAYLIST_ID = '2619366284';

// 第三方 Meting API 地址（用于获取网易云歌曲的可播放地址）
// 备选: https://meting-api-omega.vercel.app/
export const METING_API_BASE = 'https://api.qijieya.cn/meting/';

// 缓存版本号，修改后递增以强制刷新
export const MUSIC_CACHE_VERSION = '2';

// 音源类型，网易云为 netease
export const MUSIC_SERVER = 'netease';

/** 读取歌单 ID：优先 localStorage 覆盖，便于不改代码切换 */
export function getPlaylistId(): string {
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('music_playlist_id');
    if (override && override.trim()) return override.trim();
  }
  return DEFAULT_PLAYLIST_ID;
}
