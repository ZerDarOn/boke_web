import type { SiteConfig } from './siteConfig';

export interface SettingsTabProps {
  config: SiteConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface HeroSettingsTabProps extends SettingsTabProps {
  editingHero: string | null;
  setEditingHero: (id: string | null) => void;
  updateHeroContent: (heroId: string, lang: 'ZH' | 'EN', field: string, value: string) => void;
  setConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
}
