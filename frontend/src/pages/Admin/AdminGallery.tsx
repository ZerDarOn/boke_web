import React, { useState } from 'react';
import { api, GalleryImage, Album } from '../../lib/api';
import { useGalleryAlbums, useAdminGalleryPhotos } from '../../hooks/queries/gallery';
import { uploadImage } from '../../lib/upload';
import {
  Search, Plus, Edit, Trash2, Loader2, X, Save,
  Camera, Folder, Image as ImageIcon, ArrowLeft,
  Grid, List, Eye, Calendar, MapPin
} from 'lucide-react';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

// 相册类型扩展
type GalleryView = 'albums' | 'photos';

const AdminGallery: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const [view, setView] = useState<GalleryView>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  const {
    data: albums = [],
    isLoading: albumsLoading,
    refetch: refetchAlbums,
  } = useGalleryAlbums();
  const {
    data: photos = [],
    isLoading: photosLoading,
    refetch: refetchPhotos,
  } = useAdminGalleryPhotos(selectedAlbum?.id, view === 'photos');

  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<GalleryImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [albumForm, setAlbumForm] = useState<Partial<Album>>({
    title: '',
    cover: '',
    location: '',
    thoughts: ''
  });
  
  const [photoForm, setPhotoForm] = useState<Partial<GalleryImage>>({
    title: '',
    src: '',
    description: '',
    location: '',
    camera: '',
    settings: '',
    aspect: 'landscape',
    tags: []
  });

  const refreshAlbums = () => refetchAlbums();
  const refreshPhotos = () => refetchPhotos();

  // 进入相册
  const handleEnterAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setView('photos');
  };

  // 返回相册列表
  const handleBackToAlbums = () => {
    setView('albums');
    setSelectedAlbum(null);
  };

  // 创建相册
  const handleCreateAlbum = () => {
    setEditingAlbum(null);
    setAlbumForm({
      title: '',
      cover: '',
      location: '',
      thoughts: ''
    });
    setIsModalOpen(true);
  };

  // 编辑相册
  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setAlbumForm({ ...album });
    setIsModalOpen(true);
  };

  // 保存相册
  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAlbum) {
        // 更新相册 - 通过更新该相册的所有照片
        const albumPhotos = photos.filter(p => p.albumId === editingAlbum.id);
        for (const photo of albumPhotos) {
          await api.gallery.update(photo.id, {
            album: { ...albumForm, id: editingAlbum.id } as Album
          });
        }
      } else {
        // 创建新相册 - 创建一张封面照片
        if (albumForm.cover) {
          await api.gallery.create({
            title: albumForm.title || '未命名相册',
            src: albumForm.cover,
            album: {
              ...albumForm,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              photoCount: 0
            } as Album,
            date: new Date().toISOString().split('T')[0],
            aspect: 'landscape',
            tags: []
          });
        }
      }
      setIsModalOpen(false);
      refreshAlbums();
      toast.success('保存成功');
    } catch (err) {
      console.error('Failed to save album:', err);
      toast.error('保存失败');
    }
  };

  // 删除相册
  const handleDeleteAlbum = async (albumId: string) => {
    if (!(await confirm({ message: '确定要删除这个相册吗？相册内的照片将被移出相册。' }))) return;

    try {
      // 将该相册的所有照片移出相册
      const albumPhotos = photos.filter(p => p.albumId === albumId);
      for (const photo of albumPhotos) {
        await api.gallery.update(photo.id, { albumId: undefined, album: undefined });
      }
      refreshAlbums();
      toast.success('删除成功');
    } catch (err) {
      console.error('Failed to delete album:', err);
      toast.error('删除失败');
    }
  };

  // 创建照片
  const handleCreatePhoto = () => {
    setEditingPhoto(null);
    setPhotoForm({
      title: '',
      src: '',
      description: '',
      location: '',
      camera: '',
      settings: '',
      aspect: 'landscape',
      tags: [],
      albumId: selectedAlbum?.id
    });
    setIsPhotoModalOpen(true);
  };

  // 编辑照片
  const handleEditPhoto = (photo: GalleryImage) => {
    setEditingPhoto(photo);
    setPhotoForm({ ...photo });
    setIsPhotoModalOpen(true);
  };

  // 保存照片
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPhoto) {
        await api.gallery.update(editingPhoto.id, photoForm);
      } else {
        await api.gallery.create({
          ...photoForm,
          date: new Date().toISOString().split('T')[0],
          albumId: selectedAlbum?.id,
          album: selectedAlbum || undefined
        } as GalleryImage);
      }
      setIsPhotoModalOpen(false);
      refreshPhotos();
      refreshAlbums(); // 更新相册计数
      toast.success('保存成功');
    } catch (err) {
      console.error('Failed to save photo:', err);
      toast.error('保存失败');
    }
  };

  // 删除照片
  const handleDeletePhoto = async (photoId: string) => {
    if (!(await confirm({ message: '确定要删除这张照片吗？' }))) return;

    try {
      await api.gallery.delete(photoId);
      refreshPhotos();
      refreshAlbums();
      toast.success('删除成功');
    } catch (err) {
      console.error('Failed to delete photo:', err);
      toast.error('删除失败');
    }
  };

  // 图片上传处理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAlbumCover = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('图片大小不能超过 10MB');
      return;
    }

    try {
      setUploadingImage(true);

      // 上传到服务器
      const imageUrl = await uploadImage(file, 'gallery');

      if (isAlbumCover) {
        setAlbumForm(prev => ({ ...prev, cover: imageUrl }));
      } else {
        setPhotoForm(prev => ({ ...prev, src: imageUrl }));
      }

    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片上传失败';
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
      // 清空 input 以便重复选择同一文件
      e.target.value = '';
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPhotos = photos.filter(photo =>
    photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (albumsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-neon" size={32} />
          <p className="text-ink dark:text-paper text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {view === 'photos' && (
            <button
              onClick={handleBackToAlbums}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink/20 to-purple-500/20 flex items-center justify-center">
            {view === 'albums' ? <Folder size={24} className="text-ink dark:text-paper" /> : <Camera size={24} className="text-ink dark:text-paper" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-paper">
              {view === 'albums' ? '相册管理' : selectedAlbum?.title || '照片管理'}
            </h1>
            <p className="text-ink/70 dark:text-gray-400">
              {view === 'albums' 
                ? `共 ${albums.length} 个相册` 
                : `共 ${photos.length} 张照片`
              }
            </p>
          </div>
        </div>
        <button 
          onClick={view === 'albums' ? handleCreateAlbum : handleCreatePhoto}
          className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          {view === 'albums' ? '新建相册' : '上传照片'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-black/30 rounded-xl p-5 border border-ink/10 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-gray-500" />
          <input
            type="text"
            placeholder={view === 'albums' ? "搜索相册..." : "搜索照片..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-ink/5 dark:bg-black/20 border border-ink/10 dark:border-gray-700 rounded-xl text-ink dark:text-paper placeholder:text-ink/40 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-ink/50 focus:border-ink/50 transition-all"
          />
        </div>
      </div>

      {/* Albums Grid */}
      {view === 'albums' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleEnterAlbum(album)}
            >
              {/* Cover Image */}
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

              {/* Info */}
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
                
                {/* Actions */}
                <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => handleEditAlbum(album)}
                    className="flex-1 py-2 px-3 bg-ink text-white rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteAlbum(album.id)}
                    className="py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredAlbums.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700">
              <Folder size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">暂无相册</h3>
              <p className="text-ink/70 dark:text-gray-400 mb-4">点击右上角按钮创建第一个相册</p>
              <button 
                onClick={handleCreateAlbum}
                className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium mx-auto"
              >
                <Plus size={18} />
                新建相册
              </button>
            </div>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {view === 'photos' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-ink/10 transition-all duration-300"
            >
              {/* Photo */}
              <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
                photo.aspect === 'portrait' ? 'aspect-[3/4]' : 
                photo.aspect === 'square' ? 'aspect-square' : 
                'aspect-[4/3]'
              }`}>
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

              {/* Info */}
              <div className="p-3">
                <h4 className="font-medium text-ink dark:text-paper text-sm mb-1 truncate">
                  {photo.title || '未命名'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                  {photo.description || '无描述'}
                </p>
                
                {/* Actions */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditPhoto(photo)}
                    className="flex-1 py-1.5 px-2 bg-ink text-white rounded hover:bg-ink/80 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Edit size={12} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="py-1.5 px-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredPhotos.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-black/30 rounded-xl border border-ink/10 dark:border-gray-700">
              <Camera size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-ink dark:text-paper mb-2">
                {selectedAlbum ? '相册为空' : '暂无照片'}
              </h3>
              <p className="text-ink/70 dark:text-gray-400 mb-4">点击右上角按钮上传照片</p>
              <button 
                onClick={handleCreatePhoto}
                className="px-6 py-3 bg-gradient-to-r from-ink to-purple-600 text-white rounded-xl hover:from-ink/80 hover:to-purple-700 transition-all shadow-lg hover:shadow-ink/25 flex items-center gap-2 font-medium mx-auto"
              >
                <Plus size={18} />
                上传照片
              </button>
            </div>
          )}
        </div>
      )}

      {/* Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAlbum ? '编辑相册' : '新建相册'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">相册名称</label>
                <input
                  type="text"
                  value={albumForm.title || ''}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="输入相册名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">封面图片</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={albumForm.cover || ''}
                    onChange={(e) => setAlbumForm(prev => ({ ...prev, cover: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="图片 URL"
                  />
                  <label className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {uploadingImage ? (
                      <Loader2 size={18} className="text-blue-600 animate-spin" />
                    ) : (
                      <Camera size={18} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {albumForm.cover && (
                  <img src={albumForm.cover} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">地点</label>
                <input
                  type="text"
                  value={albumForm.location || ''}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="拍摄地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">感想</label>
                <textarea
                  value={albumForm.thoughts || ''}
                  onChange={(e) => setAlbumForm(prev => ({ ...prev, thoughts: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                  placeholder="关于这个相册的感想..."
                />
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAlbum}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPhoto ? '编辑照片' : '上传照片'}
              </h2>
              <button onClick={() => setIsPhotoModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">照片</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photoForm.src || ''}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, src: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="图片 URL"
                    required
                  />
                  <label className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {uploadingImage ? (
                      <Loader2 size={18} className="text-blue-600 animate-spin" />
                    ) : (
                      <Camera size={18} className="text-gray-600 dark:text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {photoForm.src && (
                  <img src={photoForm.src} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                <input
                  type="text"
                  value={photoForm.title || ''}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="照片标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                <textarea
                  value={photoForm.description || ''}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                  placeholder="照片描述..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">相机</label>
                  <input
                    type="text"
                    value={photoForm.camera || ''}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, camera: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="如：Sony A7M4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">参数</label>
                  <input
                    type="text"
                    value={photoForm.settings || ''}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, settings: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="如：f/2.8 1/200s ISO100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">比例</label>
                <select
                  value={photoForm.aspect || 'landscape'}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, aspect: e.target.value as 'landscape' | 'portrait' | 'square' }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="landscape">横向 (4:3)</option>
                  <option value="portrait">纵向 (3:4)</option>
                  <option value="square">正方形 (1:1)</option>
                </select>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
