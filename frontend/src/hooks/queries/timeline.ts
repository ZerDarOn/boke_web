import { timelineApi, type TimelineEvent } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.timeline.all;

export function useTimelineList(params?: { limit?: number }) {
  return useAdminResourceList<TimelineEvent>(rootKey, timelineApi, params);
}

export function useCreateTimelineEvent() {
  return useAdminResourceCreate(rootKey, timelineApi.create!);
}

export function useUpdateTimelineEvent() {
  return useAdminResourceUpdate(rootKey, timelineApi.update!);
}

export function useDeleteTimelineEvent() {
  return useAdminResourceDelete(rootKey, timelineApi.delete!);
}
