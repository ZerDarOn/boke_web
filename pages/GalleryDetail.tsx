import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GALLERY_ALBUMS } from '../constants';
import type { GalleryItem } from '../types';
import {
  Calendar,
  Camera,
  X,
  MessageSquare,
  Send
} from 'lucide-react';
import BreadcrumbNav from '../components/BreadcrumbNav';
import BackToTop from '../components/BackToTop';

const ITEMS_PER_PAGE = 8;

const GalleryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentInput, setCommentInput] = useState('');

  const album = GALLERY_ALBUMS.find(a => a.id === id);

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  if (!album) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-ink dark:text-white mb-4">404</h1>
          <p className="font-mono text-gray-500 mb-6">相册不存在</p>
          <Link
            to="/gallery"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            返回相册列表
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(album.photos.length / ITEMS_PER_PAGE);
  const currentPhotos = album.photos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddComment = () => {
    if (!selectedPhoto || !commentInput.trim()) return;
    const newComment = {
      id: `c${Date.now()}`,
      author: 'Visitor',
      content: commentInput.trim(),
      date: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    selectedPhoto.comments = [...(selectedPhoto.comments || []), newComment];
    setCommentInput('');
  };

  const getAspectRatio = (aspect: GalleryItem['aspect']) => {
    switch (aspect) {
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      case 'square':
        return 'aspect-square';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-3 bg-neon hover:bg-neon/80 rounded-full transition-colors text-white z-10 shadow-lg shadow-neon/30"
            title="关闭 (ESC)"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-6xl h-full max-h-[90vh] flex gap-6">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative bg-[#0a0a0a] rounded-lg overflow-hidden">
                <div className={`${getAspectRatio(selectedPhoto.aspect)} w-full`}>
                  <div
                    style={{ backgroundColor: selectedPhoto.src }}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="mt-3 font-mono text-xs text-gray-400 flex items-center gap-3">
                <Camera size={12} className="text-neon" />
                <span>{selectedPhoto.camera || 'SONY A7M4'}</span>
                <span className="w-[1px] h-3 bg-gray-600"></span>
                <span>{selectedPhoto.settings || 'ISO 800, f/2.8'}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedPhoto.tags || []).map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-neon/10 text-neon rounded font-mono text-[10px] border border-neon/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-80 bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden flex flex-col border border-gray-200 dark:border-white/10">
              <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <h3 className="font-bold text-ink dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-neon" />
                  评论留言 ({selectedPhoto.comments?.length || 0})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {(selectedPhoto.comments || []).length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                    还没有评论，快来发表吧！
                  </div>
                ) : (
                  (selectedPhoto.comments || []).map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-ink dark:text-white">
                          {comment.author}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500">
                          {comment.date}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="发表评论..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-ink dark:text-white placeholder-gray-500 focus:outline-none focus:border-neon resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentInput.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                >
                  <Send size={14} />
                  发表评论
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 relative z-10">
        <BreadcrumbNav items={[
          { label: '相册', href: '/gallery' },
          { label: album.title }
        ]} />
      </div>

      <div className="mb-8">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-neon dark:hover:text-neon transition-colors font-mono text-sm group mb-6"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="group-hover:underline decoration-neon/50">返回相册列表</span>
        </Link>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-32 h-32 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-slow">
              <defs>
                <radialGradient id="inkGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#inkGradient)" className="text-ink dark:text-white"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-ink dark:text-white"/>
              <circle cx="50" cy="50" r="15" fill="currentColor" className="text-ink dark:text-white opacity-80"/>
            </svg>
          </div>

          <h2 className="text-3xl font-serif font-black text-ink dark:text-white mb-4">
            {album.title}
          </h2>

          <p className="font-serif text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6">
            {album.thoughts}
          </p>

          <div className="h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent mb-4"></div>

          <div className="flex items-center gap-4 font-mono text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="text-neon" />
            <span>{album.lastUpdated}</span>
            <span className="w-[1px] h-3 bg-gray-300 dark:bg-gray-600"></span>
            <span>最后更新</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-xl text-ink dark:text-white mb-2">
          共 {album.photoCount} 张照片
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {currentPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative group bg-gray-100 dark:bg-[#111] rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
          >
            <div className={`relative ${getAspectRatio(photo.aspect)}`}>
              <div
                style={{ backgroundColor: photo.src }}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white font-mono text-xs opacity-0 group-hover:opacity-100">
                  [VIEW]
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon disabled:opacity-30 disabled:cursor-not-allowed transition-all font-mono text-sm"
          >
            ← 上一页
          </button>

          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            第 {currentPage} / {totalPages} 页
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg hover:border-neon disabled:opacity-30 disabled:cursor-not-allowed transition-all font-mono text-sm"
          >
            下一页 →
          </button>
        </div>
      )}

      <BackToTop color="neon" />
    </div>
  );
};

export default GalleryDetail;
