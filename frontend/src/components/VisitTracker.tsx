import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dashboardApi } from '../lib/api';

const VISITOR_ID_KEY = 'ink_spirit_visitor_id';

function getVisitorId(): string {
  const stored = localStorage.getItem(VISITOR_ID_KEY);
  if (stored) return stored;

  const visitorId = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

const VisitTracker: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const day = new Date().toISOString().slice(0, 10);
    const visitKey = `ink_spirit_visit:${day}:${pathname}`;
    if (sessionStorage.getItem(visitKey)) return;

    sessionStorage.setItem(visitKey, '1');
    void dashboardApi.trackVisit(getVisitorId());
    void dashboardApi.trackBehaviorEvent(getVisitorId(), 'page_view', pathname);
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (pathname.startsWith('/admin')) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href?.startsWith('/') || href.startsWith('//')) return;
      const targetPath = href.split('#')[0].split('?')[0] || '/';
      if (targetPath === pathname) return;
      void dashboardApi.trackBehaviorEvent(getVisitorId(), 'content_click', pathname, targetPath);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [pathname]);

  return null;
};

export default VisitTracker;
