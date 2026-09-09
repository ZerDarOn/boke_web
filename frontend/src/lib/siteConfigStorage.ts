import type { SiteConfig } from './api/settings';

const SITE_CONFIG_KEY = 'site_config';
const SITE_CONFIG_TIMESTAMP_KEY = 'site_config_ts';
const SITE_CONFIG_MAX_AGE_MS = 60 * 60 * 1000;

export type PublicSiteConfig = Omit<SiteConfig, 'aiConfig'>;

const PUBLIC_SITE_CONFIG_KEYS = [
  'blogName',
  'blogSubtitle',
  'authorName',
  'authorTitle',
  'authorAvatar',
  'authorBio',
  'email',
  'github',
  'twitter',
  'bilibili',
  'wechat',
  'primaryColor',
  'secondaryColor',
  'defaultTheme',
  'cursorConfig',
  'pageCopy',
  'heroBackgrounds',
  'siteDescription',
  'siteKeywords',
  'favicon',
  'fontSettings',
] as const satisfies readonly (keyof PublicSiteConfig)[];

const PUBLIC_SITE_CONFIG_KEY_SET = new Set<string>(PUBLIC_SITE_CONFIG_KEYS);

export function toPublicSiteConfig(
  config: Partial<SiteConfig>,
): Partial<PublicSiteConfig> {
  const publicConfig: Partial<PublicSiteConfig> = {};

  for (const key of PUBLIC_SITE_CONFIG_KEYS) {
    const value = config[key];
    if (value !== undefined) {
      Object.assign(publicConfig, { [key]: value });
    }
  }

  return publicConfig;
}

export function clearSiteConfigCache(): void {
  try {
    localStorage.removeItem(SITE_CONFIG_KEY);
    localStorage.removeItem(SITE_CONFIG_TIMESTAMP_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
}

export function readPublicSiteConfig(): Partial<PublicSiteConfig> {
  try {
    const cachedAt = Number(localStorage.getItem(SITE_CONFIG_TIMESTAMP_KEY));
    if (cachedAt && Date.now() - cachedAt > SITE_CONFIG_MAX_AGE_MS) {
      clearSiteConfigCache();
      return {};
    }

    const saved = localStorage.getItem(SITE_CONFIG_KEY);
    if (!saved) return {};

    const parsed = JSON.parse(saved) as Partial<SiteConfig>;
    const publicConfig = toPublicSiteConfig(parsed);

    // Migrate caches written by older builds without ever re-persisting unknown
    // configuration keys that may contain credentials.
    if (Object.keys(parsed).some((key) => !PUBLIC_SITE_CONFIG_KEY_SET.has(key))) {
      writePublicSiteConfig(publicConfig);
    }

    return publicConfig;
  } catch {
    clearSiteConfigCache();
    return {};
  }
}

export function writePublicSiteConfig(config: Partial<SiteConfig>): void {
  try {
    localStorage.setItem(
      SITE_CONFIG_KEY,
      JSON.stringify(toPublicSiteConfig(config)),
    );
    localStorage.setItem(SITE_CONFIG_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    clearSiteConfigCache();
  }
}
