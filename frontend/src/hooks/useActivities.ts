import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { LATEST_ACTIVITIES } from '../constants';

export interface Activity {
  id: string;
  project: string;
  title: string;
  tags: string[];
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
  date: string;
}

interface UseActivitiesOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const { limit, autoFetch = true } = options;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.settings.getByKey('activities');

      if (result.success && result.data?.value) {
        const parsedActivities = typeof result.data.value === 'string'
          ? JSON.parse(result.data.value)
          : result.data.value;

        if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
          const validActivities = parsedActivities.filter((item: any) =>
            item && item.id && (item.project || item.title)
          );

          if (validActivities.length > 0) {
            setActivities(limit ? validActivities.slice(0, limit) : validActivities);
            setLoading(false);
            return;
          }
        }
      }

      const timelineResult = await api.timeline.getAll({ limit: limit || 5 });

      if (timelineResult.success && timelineResult.data && timelineResult.data.length > 0) {
        const timelineActivities: Activity[] = timelineResult.data.map((item: any) => ({
          id: item.id,
          project: 'Timeline',
          title: item.title,
          tags: [],
          status: 'DONE' as const,
          date: item.date || new Date(item.createdAt).toISOString(),
        }));
        setActivities(timelineActivities);
        setLoading(false);
        return;
      }

      const fallback = LATEST_ACTIVITIES.map(a => ({
        ...a,
        status: a.status as 'DONE' | 'IN_PROGRESS' | 'PLANNED'
      }));
      setActivities(limit ? fallback.slice(0, limit) : fallback);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to fetch activities');
      const fallback = LATEST_ACTIVITIES.map(a => ({
        ...a,
        status: a.status as 'DONE' | 'IN_PROGRESS' | 'PLANNED'
      }));
      setActivities(limit ? fallback.slice(0, limit) : fallback);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    activities,
    loading,
    error,
    refetch: fetchData,
  };
};

export default useActivities;
