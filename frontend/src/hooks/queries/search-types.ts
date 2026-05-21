import type {
  Post,
  Project,
  Diary,
  Announcement,
  Anime,
  GalleryImage,
} from '../../lib/api';

export interface LayoutSearchResults {
  posts: Post[];
  projects: Project[];
  diaries: Diary[];
  announcements: Announcement[];
  anime: Anime[];
  gallery: GalleryImage[];
}
