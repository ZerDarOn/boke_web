import { useQuery } from '@tanstack/react-query';
import {
  postsApi,
  projectsApi,
  diaryApi,
  announcementsApi,
  animeApi,
  galleryApi,
  type Post,
  type Project,
  type Diary,
  type Announcement,
  type Anime,
  type GalleryImage,
} from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export interface LayoutSearchResults {
  posts: Post[];
  projects: Project[];
  diaries: Diary[];
  announcements: Announcement[];
  anime: Anime[];
  gallery: GalleryImage[];
}

export function useLayoutSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.search(trimmed),
    queryFn: async (): Promise<LayoutSearchResults> => {
      const q = trimmed.toLowerCase();
      const [posts, projects, diaries, announcements, anime, gallery] = await Promise.all([
        unwrapApi(postsApi.getAll({ search: trimmed, limit: 5 })),
        unwrapApi(projectsApi.getAll({ search: trimmed, limit: 5 })),
        unwrapApi(diaryApi.getAll({ limit: 50 })),
        unwrapApi(announcementsApi.getAll()),
        unwrapApi(animeApi.getAll({ limit: 50 })),
        unwrapApi(galleryApi.getAll({ limit: 50 })),
      ]);

      return {
        posts,
        projects,
        diaries: diaries
          .filter(
            (d) =>
              d.content?.toLowerCase().includes(q) ||
              d.title?.toLowerCase().includes(q)
          )
          .slice(0, 5),
        announcements: announcements
          .filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.content?.toLowerCase().includes(q)
          )
          .slice(0, 5),
        anime: anime
          .filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.studios?.some((s) => s.toLowerCase().includes(q))
          )
          .slice(0, 5),
        gallery: gallery
          .filter(
            (g) =>
              g.title?.toLowerCase().includes(q) ||
              g.tags?.some((tag) => tag.toLowerCase().includes(q))
          )
          .slice(0, 5),
      };
    },
    enabled: trimmed.length > 0,
    staleTime: 60 * 1000,
  });
}
