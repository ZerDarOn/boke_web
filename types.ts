export interface BlogPost {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  stamp: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  tech: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';
  description: string;
  featured?: boolean;
  link?: string;
}

export interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  type: 'core' | 'major' | 'minor';
}

export interface Activity {
  id: string;
  project: string;
  title: string;
  tags: string[];
  status: string;
  date: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'markdown' | 'binary';
  size?: string;
  date: string;
  content?: string;
}

export interface RelationNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  avatar?: string;
  description: string;
  connections: string[];
  type: 'core' | 'major' | 'minor';
}

export interface AnimeItem {
  id: string;
  title: string;
  cover: string;
  totalEps: number;
  currentEp: number;
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;
}

export interface GalleryItem {
  id: string;
  src: string;
  title: string;
  date: string;
  location: string;
  aspect: 'portrait' | 'landscape' | 'square';
}

export interface TimelineEvent {
  id: string;
  year: string;
  date: string;
  title: string;
  description: string;
  type: 'MILESTONE' | 'JOB' | 'LIFE';
}

export interface SkillGroup {
  category: string;
  items: {
    name: string;
    level: number;
    projectCount: number;
    rank: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'IMPORTANT';
}
