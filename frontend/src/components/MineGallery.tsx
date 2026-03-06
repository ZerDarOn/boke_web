import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, GalleryImage } from '../lib/api';
import { Camera, MapPin, Calendar, Loader2 } from 'lucide-react';

const MineGallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await api.gallery.getAll();
        if (result.success && result.data) {
          // 限制显示前 6 张图片
          setImages(result.data.slice(0, 6));
        } else {
          setError(result.error || 'Failed to fetch gallery');
        }
      } catch (err) {
        console.error('Failed to fetch gallery:', err);
        setError('Failed to fetch gallery');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] p-6 min-h-[600px] transition-colors">

       <div className="mb-12 border-l-4 border-ink dark:border-white pl-6 py-2">
            <h2 className="text-4xl font-black font-sans text-ink dark:text-white mb-1">VISUAL.ARCHIVE</h2>
            <p className="font-mono text-xs text-neon uppercase tracking-widest flex items-center gap-2">
                <Camera size={12} /> Captured Moments
            </p>
       </div>

       {loading && (
         <div className="flex items-center justify-center min-h-[300px]">
           <Loader2 className="animate-spin text-neon" size={32} />
         </div>
       )}

       {error && (
         <div className="p-8">
           <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
             <p className="text-red-600 dark:text-red-300 font-mono text-sm">
               ERROR: {error}
             </p>
           </div>
         </div>
       )}

       {!loading && !error && images.length === 0 && (
         <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
           <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
             暂无照片
           </span>
         </div>
       )}

       {!loading && !error && images.length > 0 && (
         <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img) => (
                <Link
                   key={img.id}
                   to={`/gallery/${img.id}`}
                   className="break-inside-avoid block relative group bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 p-3 shadow-sm hover:shadow-xl dark:hover:border-neon/50 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                    {/* Image Container */}
                    <div
                      className={`
                        w-full relative bg-gray-100 dark:bg-[#050505] overflow-hidden
                        ${img.aspect === 'portrait' ? 'aspect-[3/4]' : ''}
                        ${img.aspect === 'landscape' ? 'aspect-[4/3]' : ''}
                        ${img.aspect === 'square' ? 'aspect-square' : ''}
                        ${!img.aspect ? 'aspect-[4/3]' : ''}
                      `}
                    >
                        {/* Image */}
                        {img.src ? (
                          <img
                            src={img.src}
                            alt={img.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div
                            className="w-full h-full transition-transform duration-700 group-hover:scale-110 bg-gradient-to-br from-ink/10 to-neon/10"
                          ></div>
                        )}

                        {/* Hover Overlay - Sword Slash */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            {/* The Slash Line */}
                            <div className="w-full h-[2px] bg-neon shadow-[0_0_20px_#10b981] transform -rotate-12 scale-x-0 group-hover:scale-x-150 transition-transform duration-500 delay-100"></div>
                        </div>

                        {/* Top Right Corner Accent */}
                        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Metadata Reveal on Hover */}
                    <div className="mt-4 flex justify-between items-end opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                       <div>
                           <h3 className="font-sans font-bold text-lg text-ink dark:text-white group-hover:text-neon transition-colors">
                               {img.title}
                           </h3>
                           <div className="flex flex-col gap-0.5 mt-1">
                               <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                                   <Calendar size={10} /> {formatDate(img.date)}
                               </span>
                               {img.location && (
                                 <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                                   <MapPin size={10} /> {img.location}
                                 </span>
                               )}
                           </div>
                       }

                       <div className="font-mono text-xs text-gray-300 dark:text-gray-600 group-hover:text-ink dark:group-hover:text-white font-bold">
                           #{img.id}
                       </div>
                    </div>

                </Link>
            ))}
       </div>
       )}
    </div>
  );
};

export default MineGallery;