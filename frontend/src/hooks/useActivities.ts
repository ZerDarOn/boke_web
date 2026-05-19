import { useActivities as useActivitiesQuery, type Activity } from './queries/activities';

export type { Activity };

interface UseActivitiesOptions {
  limit?: number;
}

export default function useActivities(options: UseActivitiesOptions = {}) {
  const { limit } = options;
  const { data, isLoading, error, refetch } = useActivitiesQuery(limit);

  return {
    activities: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
}
