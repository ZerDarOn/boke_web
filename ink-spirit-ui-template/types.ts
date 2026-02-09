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
  content: string; // Will be displayed vertically
  stamp: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  tech: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';
  description: string;
  featured?: boolean; // New field for Primary vs Other
  link?: string;
}

export interface SkillNode {
  id: string;
  label: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  connections: string[]; // IDs of connected nodes
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

// New Types
export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'markdown' | 'binary';
  size?: string;
  date: string;
  content?: string; // Markdown content
}

export interface RelationNode {
  id: string;
  name: string;
  role: string;
  x: number; // 0-100
  y: number; // 0-100
  avatar?: string;
  description: string;
  connections: string[];
  type: 'core' | 'major' | 'minor'; // Added for visual hierarchy
}

export interface AnimeItem {
  id: string;
  title: string;
  cover: string; // Placeholder color or url
  totalEps: number;
  currentEp: number;
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;
}

export interface GalleryItem {
  id: string;
  src: string; // Placeholder color or url
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
    level: number; // 0-100
    projectCount: number;
    rank: string; // e.g. "MASTER", "EXPERT", "ADEPT"
  }[];
}