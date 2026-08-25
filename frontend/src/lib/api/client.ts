import { authApi } from './auth';
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
import { musicApi } from './music';
import { contentOperationsApi } from './content-operations';

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
  music: musicApi,
  contentOperations: contentOperationsApi,
};
