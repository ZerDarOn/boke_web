import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import prisma from '../lib/prisma';

interface ExportOptions {
  type?: 'all' | 'post' | 'project' | 'anime' | 'diary' | 'timeline' | 'skill' | 'gallery' | 'announcement';
  downloadImages?: boolean;
}

interface ContentExport {
  content: string;
  type: string;
  filePath: string;
}

/**
 * 导出服务
 */
export class ExportService {
  /**
   * 导出所有内容为 ZIP
   */
  async exportAll(options: ExportOptions = {}): Promise<Buffer> {
    const allExports: ContentExport[] = [];

    // 导出所有类型
    allExports.push(...await this.exportPosts());
    allExports.push(...await this.exportProjects());
    allExports.push(...await this.exportAllAnime());
    allExports.push(...await this.exportDiaries());
    allExports.push(...await this.exportTimeline());
    allExports.push(...await this.exportSkills());
    allExports.push(...await this.exportGallery());
    allExports.push(...await this.exportAnnouncements());

    return await this.createZip(allExports);
  }

  /**
   * 导出指定类型的内容
   */
  async exportByType(type: string, downloadImages = false): Promise<Buffer> {
    let exports: ContentExport[] = [];

    switch (type) {
      case 'post':
        exports = await this.exportPosts();
        break;
      case 'project':
        exports = await this.exportProjects();
        break;
      case 'anime':
        exports = await this.exportAllAnime();
        break;
      case 'diary':
        exports = await this.exportDiaries();
        break;
      case 'timeline':
        exports = await this.exportTimeline();
        break;
      case 'skill':
        exports = await this.exportSkills();
        break;
      case 'gallery':
        exports = await this.exportGallery();
        break;
      case 'announcement':
        exports = await this.exportAnnouncements();
        break;
      default:
        throw new Error(`Unsupported type: ${type}`);
    }

    return await this.createZip(exports);
  }

  /**
   * 导出单个内容
   */
  async exportById(type: string, id: string, downloadImages = false): Promise<ContentExport> {
    switch (type) {
      case 'post':
        return await this.exportPostById(id);
      case 'project':
        return await this.exportProjectById(id);
      case 'anime':
        return await this.exportAnimeById(id);
      case 'diary':
        return await this.exportDiaryById(id);
      case 'timeline':
        return await this.exportTimelineById(id);
      case 'skill':
        return await this.exportSkillById(id);
      case 'gallery':
        return await this.exportGalleryById(id);
      case 'announcement':
        return await this.exportAnnouncementById(id);
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  /**
   * 导出所有文章
   */
  private async exportPosts(): Promise<ContentExport[]> {
    const posts = await prisma.post.findMany({
      orderBy: { date: 'desc' }
    });

    return Promise.all(
      posts.map(post => this.exportPost(post))
    );
  }

  /**
   * 导出单个文章
   */
  private async exportPostById(id: string): Promise<ContentExport> {
    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return this.exportPost(post);
  }

  /**
   * 转换文章为 Markdown
   */
  private async exportPost(post: any): Promise<ContentExport> {
    const frontMatter = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      date: post.date.toISOString(),
      lastUpdated: post.updatedAt.toISOString(),
      published: post.isPublished,
      accessLevel: post.accessLevel,
      category: post.category,
      tags: post.tags,
      excerpt: post.excerpt,
      readingTime: post.readingTime
    };

    const content = post.content;
    const filePath = `content/posts/${this.slugify(post.title)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'post',
      filePath
    };
  }

  /**
   * 导出所有项目
   */
  private async exportProjects(): Promise<ContentExport[]> {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(
      projects.map(project => this.exportProject(project))
    );
  }

  /**
   * 导出单个项目
   */
  private async exportProjectById(id: string): Promise<ContentExport> {
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return this.exportProject(project);
  }

  /**
   * 转换项目为 Markdown
   */
  private async exportProject(project: any): Promise<ContentExport> {
    const frontMatter = {
      id: project.id,
      title: project.name,
      slug: project.slug,
      date: project.startDate?.toISOString() || project.createdAt.toISOString(),
      type: 'project',
      status: String(project.status || ''),
      tech: project.tech,
      repository: project.githubUrl,
      demoUrl: project.demoUrl
    };

    const content = project.description + (project.readme ? '\n\n' + project.readme : '');
    const filePath = `content/projects/${this.slugify(project.name)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'project',
      filePath
    };
  }

  /**
   * 导出所有动漫
   */
  private async exportAllAnime(): Promise<ContentExport[]> {
    const animeList = await prisma.anime.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(
      animeList.map(anime => this.exportAnime(anime))
    );
  }

  /**
   * 导出单个动漫
   */
  private async exportAnimeById(id: string): Promise<ContentExport> {
    const anime = await prisma.anime.findUnique({
      where: { id }
    });

    if (!anime) {
      throw new Error('Anime not found');
    }

    return this.exportAnime(anime);
  }

  /**
   * 转换动漫为 Markdown
   */
  private async exportAnime(anime: any): Promise<ContentExport> {
    const frontMatter = {
      id: anime.id,
      title: anime.title,
      slug: anime.title.toLowerCase().replace(/\s+/g, '-'),
      date: anime.startDate?.toISOString() || anime.createdAt.toISOString(),
      type: 'anime',
      type_anime: String(anime.type || ''),
      episodes: anime.episodes,
      currentEp: anime.currentEp,
      status: String(anime.status || ''),
      score: anime.score,
      favorite: anime.favorite,
      studios: anime.studios,
      genres: anime.genres,
      cover: anime.cover
    };

    const content = anime.synopsis || '';
    const filePath = `content/anime/${this.slugify(anime.title)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'anime',
      filePath
    };
  }

  /**
   * 导出所有日记
   */
  private async exportDiaries(): Promise<ContentExport[]> {
    const diaries = await prisma.diary.findMany({
      orderBy: { date: 'desc' }
    });

    return Promise.all(
      diaries.map(diary => this.exportDiary(diary))
    );
  }

  /**
   * 导出单个日记
   */
  private async exportDiaryById(id: string): Promise<ContentExport> {
    const diary = await prisma.diary.findUnique({
      where: { id }
    });

    if (!diary) {
      throw new Error('Diary not found');
    }

    return this.exportDiary(diary);
  }

  /**
   * 转换日记为 Markdown
   */
  private async exportDiary(diary: any): Promise<ContentExport> {
    const frontMatter = {
      id: diary.id,
      title: diary.title || diary.date.toISOString().split('T')[0],
      slug: diary.date.toISOString().split('T')[0],
      date: diary.date.toISOString(),
      type: String(diary.type || ''),
      mood: diary.mood,
      weather: diary.weather,
      location: diary.location
    };

    const content = diary.content || diary.longContent || '';
    const filePath = `content/diary/${this.slugify(diary.title || diary.date.toISOString())}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'diary',
      filePath
    };
  }

  /**
   * 导出所有时间线
   */
  private async exportTimeline(): Promise<ContentExport[]> {
    const events = await prisma.timelineEvent.findMany({
      orderBy: { date: 'desc' }
    });

    return Promise.all(
      events.map(event => this.exportTimelineEvent(event))
    );
  }

  /**
   * 导出单个时间线
   */
  private async exportTimelineById(id: string): Promise<ContentExport> {
    const event = await prisma.timelineEvent.findUnique({
      where: { id }
    });

    if (!event) {
      throw new Error('Timeline event not found');
    }

    return this.exportTimelineEvent(event);
  }

  /**
   * 转换时间线为 Markdown
   */
  private async exportTimelineEvent(event: any): Promise<ContentExport> {
    const frontMatter = {
      id: event.id,
      title: event.title,
      slug: event.year + '-' + event.date,
      date: event.year + '-' + event.date,
      type: 'timeline',
      category: String(event.type || '')
    };

    const content = event.description;
    const filePath = `content/timeline/${event.year}-${this.slugify(event.title)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'timeline',
      filePath
    };
  }

  /**
   * 导出所有技能
   */
  private async exportSkills(): Promise<ContentExport[]> {
    const skills = await prisma.skill.findMany({
      orderBy: { level: 'desc' }
    });

    return Promise.all(
      skills.map(skill => this.exportSkill(skill))
    );
  }

  /**
   * 导出单个技能
   */
  private async exportSkillById(id: string): Promise<ContentExport> {
    const skill = await prisma.skill.findUnique({
      where: { id }
    });

    if (!skill) {
      throw new Error('Skill not found');
    }

    return this.exportSkill(skill);
  }

  /**
   * 转换技能为 Markdown
   */
  private async exportSkill(skill: any): Promise<ContentExport> {
    const frontMatter = {
      id: skill.id,
      title: skill.name,
      slug: skill.name.toLowerCase().replace(/\s+/g, '-'),
      date: skill.createdAt.toISOString(),
      type: 'skill',
      level: skill.level,
      category: skill.category,
      image: skill.image
    };

    const content = skill.description || '';
    const filePath = `content/skills/${this.slugify(skill.name)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'skill',
      filePath
    };
  }

  /**
   * 导出所有相册
   */
  private async exportGallery(): Promise<ContentExport[]> {
    const photos = await prisma.galleryImage.findMany({
      orderBy: { date: 'desc' }
    });

    return Promise.all(
      photos.map(photo => this.exportGalleryImage(photo))
    );
  }

  /**
   * 导出单个相册
   */
  private async exportGalleryById(id: string): Promise<ContentExport> {
    const photo = await prisma.galleryImage.findUnique({
      where: { id }
    });

    if (!photo) {
      throw new Error('Gallery image not found');
    }

    return this.exportGalleryImage(photo);
  }

  /**
   * 转换相册为 Markdown
   */
  private async exportGalleryImage(photo: any): Promise<ContentExport> {
    const frontMatter = {
      id: photo.id,
      title: photo.title,
      slug: photo.title.toLowerCase().replace(/\s+/g, '-'),
      date: photo.date.toISOString(),
      type: 'gallery',
      album: photo.albumId,
      aspect: String(photo.aspect || ''),
      location: photo.location,
      camera: photo.camera,
      settings: photo.settings
    };

    const content = photo.description || '';
    const filePath = `content/gallery/${this.slugify(photo.title)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'gallery',
      filePath
    };
  }

  /**
   * 导出所有公告
   */
  private async exportAnnouncements(): Promise<ContentExport[]> {
    const announcements = await prisma.announcement.findMany({
      orderBy: { date: 'desc' }
    });

    return Promise.all(
      announcements.map(announcement => this.exportAnnouncement(announcement))
    );
  }

  /**
   * 导出单个公告
   */
  private async exportAnnouncementById(id: string): Promise<ContentExport> {
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    return this.exportAnnouncement(announcement);
  }

  /**
   * 转换公告为 Markdown
   */
  private async exportAnnouncement(announcement: any): Promise<ContentExport> {
    const frontMatter = {
      id: announcement.id,
      title: announcement.title,
      slug: announcement.createdAt.toISOString().split('T')[0],
      date: announcement.date.toISOString(),
      type: String(announcement.type || ''),
      endDate: announcement.endDate?.toISOString()
    };

    const content = announcement.content;
    const filePath = `content/announcements/${this.slugify(announcement.title)}.md`;

    return {
      content: this.createMarkdown(frontMatter, content),
      type: 'announcement',
      filePath
    };
  }

  /**
   * 创建 Markdown 文件内容
   */
  private createMarkdown(frontMatter: any, content: string): string {
    const yaml = Object.entries(frontMatter)
      .map(([key, value]) => {
        if (value === undefined || value === null) return '';
        if (Array.isArray(value)) {
          return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
        }
        if (typeof value === 'boolean') {
          return `${key}: ${value}`;
        }
        return `${key}: "${value}"`;
      })
      .filter(line => line !== '')
      .join('\n');

    return `---\n${yaml}\n---\n\n${content}`;
  }

  /**
   * 创建 ZIP 文件
   */
  private createZip(exports: ContentExport[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('error', reject);
      archive.on('end', () => resolve(Buffer.concat(chunks)));

      // 添加所有文件到 ZIP
      for (const exp of exports) {
        archive.append(exp.content, { name: exp.filePath });
      }
      
      archive.finalize();
    });
  }

  /**
   * 生成 URL 友好的 slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
}

export default ExportService;
