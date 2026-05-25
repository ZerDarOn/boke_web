import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiPath = path.join(__dirname, '../src/lib/api.ts');
const outDir = path.join(__dirname, '../src/lib/api');

const nameMap = {
  Auth: 'auth',
  'Blog Posts': 'posts',
  Projects: 'projects',
  Anime: 'anime',
  Diary: 'diary',
  Gallery: 'gallery',
  Skills: 'skills',
  Timeline: 'timeline',
  'Current Status': 'current-status',
  'History Items': 'history',
  Network: 'network',
  'Universe (宇宙图)': 'universe',
  Dashboard: 'dashboard',
  Announcements: 'announcements',
  Search: 'search',
  'Health Check': 'health',
  Files: 'files',
  'Users (Placeholder - backend not implemented)': 'users',
  'Site Settings': 'settings',
};

const src = fs.readFileSync(apiPath, 'utf8');
const lines = src.split(/\r?\n/);

const sections = [];
let current = null;

for (const line of lines) {
  const m = line.match(/^\/\/ =+ (.+?) =+/);
  if (m) {
    if (current) sections.push(current);
    current = { title: m[1], lines: [] };
  } else if (current) {
    current.lines.push(line);
  }
}
if (current) sections.push(current);

function importsFor(file) {
  if (file === 'dashboard') {
    return `import { apiRequest } from './request';
import type { Post } from './posts';
import type { Project } from './projects';
`;
  }
  if (file === 'gallery') {
    return `import { apiRequest } from './request';
import type { PhotoComment } from '../../types';
`;
  }
  if (file === 'files') {
    return `import { API_BASE_URL } from '../apiConfig';
import { apiRequest, getAuthHeaders, getAuthToken, type ApiResponse } from './request';
`;
  }
  return `import { apiRequest, getAuthHeaders, getAuthToken } from './request';
`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const s of sections) {
  const file = nameMap[s.title];
  if (!file) {
    console.error('Unknown section:', s.title);
    process.exit(1);
  }
  const body = s.lines.join('\n').trim();
  const content = `${importsFor(file)}\n${body}\n`;
  fs.writeFileSync(path.join(outDir, `${file}.ts`), content);
  console.log('Wrote', `${file}.ts`);
}

const clientTs = `import { authApi } from './auth';
import { postsApi } from './posts';
import { projectsApi } from './projects';
import { animeApi } from './anime';
import { diaryApi } from './diary';
import { galleryApi } from './gallery';
import { skillsApi } from './skills';
import { timelineApi } from './timeline';
import { currentStatusApi } from './current-status';
import { historyApi } from './history';
import { networkApi } from './network';
import { universeApi } from './universe';
import { dashboardApi } from './dashboard';
import { announcementsApi } from './announcements';
import { searchApi } from './search';
import { healthApi } from './health';
import { usersApi } from './users';
import { settingsApi } from './settings';
import { filesApi } from './files';

export const api = {
  auth: authApi,
  posts: postsApi,
  projects: projectsApi,
  anime: animeApi,
  diary: diaryApi,
  gallery: galleryApi,
  skills: skillsApi,
  timeline: timelineApi,
  currentStatus: currentStatusApi,
  history: historyApi,
  network: networkApi,
  universe: universeApi,
  dashboard: dashboardApi,
  announcements: announcementsApi,
  search: searchApi,
  health: healthApi,
  users: usersApi,
  settings: settingsApi,
  files: filesApi,
};
`;

fs.writeFileSync(path.join(outDir, 'client.ts'), clientTs);
console.log('Wrote client.ts');
