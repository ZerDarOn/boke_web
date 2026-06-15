import axios from 'axios';

const STEAM_API_BASE = 'https://api.steampowered.com';

/**
 * Steam API 返回的单个游戏数据结构
 */
interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
  rtime_last_played: number;
}

interface SteamLibraryResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

/**
 * 调用 Steam Web API 获取用户的完整游戏库
 * @param steamId  64位 Steam ID
 * @param apiKey   Steam Web API Key
 */
export async function fetchSteamLibrary(
  steamId: string,
  apiKey: string,
): Promise<SteamGame[]> {
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`;

  const { data } = await axios.get<SteamLibraryResponse>(url, {
    params: {
      key: apiKey,
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true,
    },
    timeout: 30000,
  });

  return data.response.games || [];
}

/**
 * 将 Steam 游戏数据转换为 Prisma 可用的 Game 创建字段
 * 新同步的游戏默认 isHidden=true（不在前端展示），status=WANT_TO_PLAY
 */
export function steamGameToPrisma(steamGame: SteamGame) {
  return {
    title: steamGame.name,
    platform: 'STEAM' as const,
    platformId: String(steamGame.appid),
    storeUrl: `https://store.steampowered.com/app/${steamGame.appid}`,
    cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamGame.appid}/library_600x900.jpg`,
    bannerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamGame.appid}/header.jpg`,
    playtime: steamGame.playtime_forever,
    lastPlayed: steamGame.rtime_last_played
      ? new Date(steamGame.rtime_last_played * 1000)
      : null,
    status: 'WANT_TO_PLAY' as const,
    isHidden: true,
  };
}
