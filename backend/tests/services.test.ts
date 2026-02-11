import { PostService } from '../src/services/post.service';
import { ProjectService } from '../src/services/project.service';
import { AnimeService } from '../src/services/anime.service';
import { AnnouncementService } from '../src/services/announcement.service';

describe('Post Service', () => {
  test('should find posts', async () => {
    const result = await PostService.findMany({
      pagination: { page: 1, limit: 10, skip: 0 },
    });
    expect(result).toHaveProperty('posts');
    expect(result).toHaveProperty('total');
  });

  test('should get categories', async () => {
    const categories = await PostService.getCategories();
    expect(Array.isArray(categories)).toBe(true);
  });

  test('should get popular tags', async () => {
    const tags = await PostService.getPopularTags(10);
    expect(Array.isArray(tags)).toBe(true);
  });
});

describe('Project Service', () => {
  test('should find projects', async () => {
    const result = await ProjectService.findMany({
      pagination: { page: 1, limit: 10, skip: 0 },
    });
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('total');
  });
});

describe('Anime Service', () => {
  test('should find anime', async () => {
    const result = await AnimeService.findMany({
      pagination: { page: 1, limit: 10, skip: 0 },
    });
    expect(result).toHaveProperty('anime');
    expect(result).toHaveProperty('total');
  });
});

describe('Announcement Service', () => {
  test('should find announcements', async () => {
    const announcements = await AnnouncementService.findMany();
    expect(Array.isArray(announcements)).toBe(true);
  });
});
