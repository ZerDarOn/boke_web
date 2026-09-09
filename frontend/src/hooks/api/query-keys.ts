export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.posts.lists(), params ?? {}] as const,
    nav: () => [...queryKeys.posts.all, 'nav'] as const,
    categories: () => [...queryKeys.posts.all, 'categories'] as const,
    tags: () => [...queryKeys.posts.all, 'tags'] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    related: (id: string) => [...queryKeys.posts.all, 'related', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.projects.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  gallery: {
    all: ['gallery'] as const,
    images: (params?: Record<string, unknown>) =>
      [...queryKeys.gallery.all, 'images', params ?? {}] as const,
    albums: () => [...queryKeys.gallery.all, 'albums'] as const,
    detail: (id: string) => [...queryKeys.gallery.all, 'detail', id] as const,
  },
  diary: {
    all: ['diary'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.diary.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.diary.all, 'detail', id] as const,
  },
  anime: {
    all: ['anime'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.anime.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.anime.all, 'detail', id] as const,
  },
  games: {
    all: ['games'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.games.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.games.all, 'detail', id] as const,
  },
  announcements: {
    all: ['announcements'] as const,
    list: () => [...queryKeys.announcements.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.announcements.all, 'detail', id] as const,
  },
  skills: { all: ['skills'] as const, list: () => [...queryKeys.skills.all, 'list'] as const },
  timeline: {
    all: ['timeline'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.timeline.all, 'list', params ?? {}] as const,
  },
  network: { all: ['network'] as const, list: () => [...queryKeys.network.all, 'list'] as const },
  universe: { all: ['universe'] as const, list: () => [...queryKeys.universe.all, 'list'] as const },
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
    contentOperations: () => ['dashboard', 'content-operations'] as const,
  },
  settings: {
    all: ['settings'] as const,
    publicSite: () => [...queryKeys.settings.all, 'public-site'] as const,
    site: () => [...queryKeys.settings.all, 'site'] as const,
    key: (key: string) => [...queryKeys.settings.all, 'key', key] as const,
  },
  activities: () => ['activities'] as const,
  search: (q: string) => ['search', q] as const,
  currentStatus: () => ['current-status'] as const,
  history: () => ['history'] as const,
  files: (path?: string) => ['files', path ?? ''] as const,
  auth: { me: () => ['auth', 'me'] as const },
  divination: {
    all: ['divination'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.divination.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.divination.all, 'detail', id] as const,
  },
};
