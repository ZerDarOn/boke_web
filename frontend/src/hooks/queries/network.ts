import { networkApi, type NetworkNode } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.network.all;

export function useNetworkNodes(params?: { page?: number; limit?: number }) {
  return useAdminResourceList<NetworkNode>(rootKey, networkApi, params);
}

export function useCreateNetworkNode() {
  return useAdminResourceCreate(rootKey, networkApi.create!);
}

export function useUpdateNetworkNode() {
  return useAdminResourceUpdate(rootKey, networkApi.update!);
}

export function useDeleteNetworkNode() {
  return useAdminResourceDelete(rootKey, networkApi.delete!);
}
