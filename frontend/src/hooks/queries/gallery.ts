import { useQuery } from '@tanstack/react-query';
import { galleryApi, type Album, type GalleryImage } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.gallery.all;

export function useGalleryAlbums() {
  return useQuery({
    queryKey: [...queryKeys.gallery.all, 'albums-derived'],
    queryFn: async (): Promise<Album[]> => {
      const photos = await unwrapApi(galleryApi.getAll());
      const albumMap = new Map<string, Album>();
      photos.forEach((photo) => {
        if (photo.album) {
          albumMap.set(photo.album.id, photo.album);
        }
      });
      return Array.from(albumMap.values());
    },
  });
}

export function useGalleryImages(params?: { page?: number; limit?: number; albumId?: string }) {
  return useQuery({
    queryKey: queryKeys.gallery.images(params),
    queryFn: () => unwrapApi(galleryApi.getAll(params)),
  });
}

/** 管理后台：按相册筛选照�?*/
export function useAdminGalleryPhotos(albumId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.gallery.images({ albumId, limit: 100, admin: true }),
    queryFn: () =>
      unwrapApi(
        galleryApi.getAll({
          limit: 100,
          ...(albumId ? { albumId } : {}),
        })
      ),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGalleryImage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.gallery.detail(id ?? ''),
    queryFn: () => unwrapApi(galleryApi.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateGalleryImage() {
  return useAdminResourceCreate<GalleryImage>(rootKey, galleryApi.create!);
}

export function useUpdateGalleryImage() {
  return useAdminResourceUpdate<GalleryImage>(rootKey, galleryApi.update!);
}

export function useDeleteGalleryImage() {
  return useAdminResourceDelete<GalleryImage>(rootKey, galleryApi.delete!);
}
