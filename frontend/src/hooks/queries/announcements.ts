import { useQuery } from '@tanstack/react-query';
import { announcementsApi, type Announcement } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.announcements.all;

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.list(),
    queryFn: () => unwrapApi(announcementsApi.getAll()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id ?? ''),
    queryFn: () => unwrapApi(announcementsApi.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  return useAdminResourceCreate<Announcement>(rootKey, announcementsApi.create!);
}

export function useUpdateAnnouncement() {
  return useAdminResourceUpdate<Announcement>(rootKey, announcementsApi.update!);
}

export function useDeleteAnnouncement() {
  return useAdminResourceDelete<Announcement>(rootKey, announcementsApi.delete!);
}
