import type { CompanionPageContext, CompanionPageType } from './api';

const MAX_PATH_LENGTH = 240;
const MAX_TITLE_LENGTH = 160;

function resolveCompanionPageType(pathname: string): CompanionPageType {
  if (pathname === '/') return 'home';
  if (pathname === '/posts') return 'posts';
  if (pathname.startsWith('/posts/')) return 'post';
  if (pathname === '/archives') return 'archives';
  if (pathname.startsWith('/announcement')) return 'announcement';
  if (pathname === '/projects') return 'projects';
  if (pathname.startsWith('/projects/')) return 'project';
  if (pathname === '/skills') return 'skills';
  if (pathname === '/timeline') return 'timeline';
  if (pathname.startsWith('/gallery')) return 'gallery';
  if (pathname.startsWith('/diary')) return 'diary';
  if (pathname.startsWith('/anime')) return 'anime';
  if (pathname.startsWith('/games')) return 'games';
  if (pathname === '/about') return 'about';
  if (pathname === '/network') return 'network';
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/music') return 'music';
  return 'default';
}

export function getCompanionPageContext(
  pathname: string,
  title: string
): CompanionPageContext {
  return {
    page_type: resolveCompanionPageType(pathname),
    pathname: pathname.slice(0, MAX_PATH_LENGTH),
    title: title.slice(0, MAX_TITLE_LENGTH),
  };
}
