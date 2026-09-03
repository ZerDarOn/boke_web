import React, { useState } from 'react';
import { galleryApi, GalleryImage, Album } from '../../lib/api';
import { useGalleryAlbums, useAdminGalleryPhotos } from '../../hooks/queries/gallery';
import { unwrapApi } from '../../hooks/api/fetcher';
import {
  Edit, Trash2,
  Camera, Folder, Image as ImageIcon, ArrowLeft, MapPin,
} from 'lucide-react';
import {
  AdminPageShell,
  AdminEntityModal,
  FormFields,
  useEntityForm,
  type CrudMutation,
  type FieldConfig,
} from './crud';

type GalleryView = 'albums' | 'photos';

const albumFields: FieldConfig[] = [
  { key: 'title', label: '相册名称', type: 'text', required: true, placeholder: '输入相册名称' },
  { key: 'cover', label: '封面图片', type: 'image', uploadType: 'gallery', previewClassName: 'w-32 h-32' },
  { key: 'location', label: '地点', type: 'text', placeholder: '拍摄地点' },
  { key: 'thoughts', label: '感想', type: 'textarea', rows: 3, placeholder: '关于这个相册的感想...', colSpan: 2 },
];

const photoFields: FieldConfig[] = [
  { key: 'src', label: '照片', type: 'image', uploadType: 'gallery', required: true, previewClassName: 'w-full h-48' },
  { key: 'title', label: '标题', type: 'text', placeholder: '照片标题', colSpan: 2 },
  { key: 'description', label: '描述', type: 'textarea', rows: 2, placeholder: '照片描述...', colSpan: 2 },
  { key: 'camera', label: '相机', type: 'text', placeholder: '如：Sony A7M4' },
  { key: 'settings', label: '参数', type: 'text', placeholder: '如：f/2.8 1/200s ISO100' },
  {
    key: 'aspect',
    label: '比例',
    type: 'select',
    options: [
      { value: 'landscape', label: '横向 (4:3)' },
      { value: 'portrait', label: '纵向 (3:4)' },
      { value: 'square', label: '正方形 (1:1)' },
    ],
  },
];

const AdminGallery: React.FC = () => {
  const [view, setView] = useState<GalleryView>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: albums = [],
    isLoading: albumsLoading,
    error: albumsError,
    refetch: refetchAlbums,
  } = useGalleryAlbums();
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
    refetch: refetchPhotos,
  } = useAdminGalleryPhotos(selectedAlbum?.id, view === 'photos');

  const refreshAlbums = () => refetchAlbums();
  const refreshPhotos = () => refetchPhotos();

  // galleryApi 直调 + refetch 的旧语义包装为 CrudMutation 形状
  const albumMutations = {
    create: {
      mutateAsync: async (data: Record<string, unknown>) => {
        await unwrapApi(galleryApi.createAlbum(data));
        refreshAlbums();
      },
      isPending: false,
    } satisfies CrudMutation,
    update: {
      mutateAsync: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
        await unwrapApi(galleryApi.updateAlbum(id, data));
        refreshAlbums();
      },
      isPending: false,
    } satisfies CrudMutation,
    delete: {
      mutateAsync: async (id: string) => {
        await unwrapApi(galleryApi.deleteAlbum(id));
        refreshAlbums();
      },
      isPending: false,
    } satisfies CrudMutation,
  };

  const photoMutations = {
    create: {
      mutateAsync: async (data: Record<string, unknown>) => {
        await unwrapApi(
          galleryApi.create({
            ...(data as Partial<GalleryImage>),
            date: new Date().toISOString().split('T')[0],
            albumId: selectedAlbum?.id,
          } as GalleryImage)
        );
        refreshPhotos();
        refreshAlbums(); // 更新相册计数
      },
      isPending: false,
    } satisfies CrudMutation,
    update: {
      mutateAsync: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
        await unwrapApi(galleryApi.update(id, data));
        refreshPhotos();
        refreshAlbums();
      },
      isPending: false,
    } satisfies CrudMutation,
    delete: {
      mutateAsync: async (id: string) => {
        await unwrapApi(galleryApi.delete(id));
        refreshPhotos();
        refreshAlbums();
      },
      isPending: false,
    } satisfies CrudMutation,
  };

  const albumForm = useEntityForm<Album>({
    createMutation: albumMutations.create,
    updateMutation: albumMutations.update,
    deleteMutation: albumMutations.delete,
    defaults: { title: '', cover: '', location: '', thoughts: '' },
    validate: (data) => (data.title?.trim() ? null : '请输入相册名称'),
  });

  const photoForm = useEntityForm<GalleryImage>({
    createMutation: photoMutations.create,
    updateMutation: photoMutations.update,
    deleteMutation: photoMutations.delete,
    defaults: {
      title: '',
      src: '',
      description: '',
      location: '',
      camera: '',
      settings: '',
      aspect: 'landscape',
      tags: [],
    },
    validate: (data) => (data.src?.trim() ? null : '请提供照片（上传或填写 URL）'),
  });

  const handleEnterAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setView('photos');
  };

  const handleBackToAlbums = () => {
    setView('albums');
    setSelectedAlbum(null);
  };

  const filteredAlbums = albums.filter(
    (album) =>
      album.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loading = view === 'albums' ? albumsLoading : photosLoading;
  const error = (view === 'albums' ? albumsError?.message : photosError?.message) ?? null;
  const isEmpty = view === 'albums' ? filteredAlbums.length === 0 : filteredPhotos.length === 0;

  return (
    <AdminPageShell
      title={view === 'albums' ? '相册管理' : selectedAlbum?.title || '照片管理'}
      icon={view === 'albums' ? <Folder size={24} /> : <Camera size={24} />}
      count={view === 'albums' ? albums.length : photos.length}
      countLabel={view === 'albums' ? '个相册' : '张照片'}
      createLabel={view === 'albums' ? '新建相册' : '上传照片'}
      onCreate={view === 'albums' ? albumForm.openCreate : photoForm.openCreate}
      headerActions={
        view === 'photos' ? (
          <button
            onClick={handleBackToAlbums}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            返回相册列表
          </button>
        ) : undefined
      }
      loading={loading}
      error={error}
      onRetry={() => (view === 'albums' ? refetchAlbums() : refetchPhotos())}
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: view === 'albums' ? '搜索相册...' : '搜索照片...',
      }}
      isEmpty={isEmpty}
      emptyEmoji={view === 'albums' ? '📁' : '📷'}
      emptyTitle={view === 'albums' ? '暂无相册' : selectedAlbum ? '相册为空' : '暂无照片'}
      emptyActionLabel={view === 'albums' ? '创建第一个相册' : '上传第一张照片'}
    >
      {view === 'albums' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleEnterAlbum(album)}
            >
              <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder size={48} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-sm font-medium">点击进入相册</p>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-ink dark:text-paper text-lg mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {album.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Camera size={14} />
                    {album.photoCount || 0} 张照片
                  </span>
                  {album.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {album.location}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => albumForm.openEdit(album)}
                    className="flex-1 py-2 px-3 bg-ink text-white rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => albumForm.remove(album.id, '确定要删除这个相册吗？相册内的照片将被移出相册。')}
                    className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300"
            >
              <div
                className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
                  photo.aspect === 'portrait'
                    ? 'aspect-[3/4]'
                    : photo.aspect === 'square'
                      ? 'aspect-square'
                      : 'aspect-[4/3]'
                }`}
              >
                {photo.src ? (
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium text-ink dark:text-paper text-sm mb-1 truncate">
                  {photo.title || '未命名'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                  {photo.description || '无描述'}
                </p>

                <div className="flex gap-1">
                  <button
                    onClick={() => photoForm.openEdit(photo)}
                    className="flex-1 py-1.5 px-2 bg-ink text-white rounded hover:bg-ink/80 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit size={12} />
                    编辑
                  </button>
                  <button
                    onClick={() => photoForm.remove(photo.id, '确定要删除这张照片吗？')}
                    className="py-1.5 px-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminEntityModal
        open={albumForm.isModalOpen}
        title={`${albumForm.editingItem ? '编辑' : '新建'}相册`}
        onClose={albumForm.closeModal}
        onSubmit={albumForm.submit}
        submitting={albumForm.isSubmitting}
        size="md"
      >
        <FormFields fields={albumFields} formData={albumForm.formData} onChange={albumForm.setField} />
      </AdminEntityModal>

      <AdminEntityModal
        open={photoForm.isModalOpen}
        title={`${photoForm.editingItem ? '编辑照片' : '上传照片'}`}
        onClose={photoForm.closeModal}
        onSubmit={photoForm.submit}
        submitting={photoForm.isSubmitting}
        size="md"
      >
        <FormFields fields={photoFields} formData={photoForm.formData} onChange={photoForm.setField} accent="cyan" />
      </AdminEntityModal>
    </AdminPageShell>
  );
};

export default AdminGallery;
