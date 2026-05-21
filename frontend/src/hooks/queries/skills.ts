import { useQuery } from '@tanstack/react-query';
import {
  skillsApi,
  type Skill,
} from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.skills.all;

export function useSkillsList() {
  return useAdminResourceList<Skill>(rootKey, skillsApi);
}

export function useSkillGroups() {
  return useQuery({
    queryKey: [...queryKeys.skills.all, 'groups'],
    queryFn: async () => {
      const groups = await unwrapApi(skillsApi.getGroups());
      return groups.map((group) => ({
        category: group.category,
        skills: group.items,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** 技能节点图（Profile 等） */
export function useSkillNodes() {
  return useQuery({
    queryKey: [...queryKeys.skills.all, 'nodes'],
    queryFn: () => unwrapApi(skillsApi.getAll()),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSkill() {
  return useAdminResourceCreate(rootKey, skillsApi.create!);
}

export function useUpdateSkill() {
  return useAdminResourceUpdate(rootKey, skillsApi.update!);
}

export function useDeleteSkill() {
  return useAdminResourceDelete(rootKey, skillsApi.delete!);
}
