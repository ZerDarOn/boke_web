import React from 'react';
import { Link } from 'react-router-dom';
import { GALLERY_IMAGES } from '../constants';
import { Camera, MapPin, Calendar } from 'lucide-react';

const MineGallery: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] p-6 min-h-[600px] transition-colors">
       
       <div className="mb-12 border-l-4 border-ink dark:border-white pl-6 py-2">
            <h2 className="text-4xl font-black font-sans text-ink dark:text-white mb-1">VISUAL.ARCHIVE</h2>
            <p className="font-mono text-xs text-neon uppercase tracking-widest flex items-center gap-2">
                <Camera size={12} /> Captured Moments
            </p>
       </div>

        {/* Masonry Layout using Columns */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {GALLERY_IMAGES.map((img) => (
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
                      `}
                   >
                        {/* Placeholder Color Block */}
                        <div 
                            className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundColor: img.src }}
                        ></div>

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
                                   <Calendar size={10} /> {img.date}
                               </span>
                               <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                                   <MapPin size={10} /> {img.location}
                               </span>
                           </div>
                       </div>
                       
                        <div className="font-mono text-xs text-gray-300 dark:text-gray-600 group-hover:text-ink dark:group-hover:text-white font-bold">
                            #{img.id}
                        </div>
                    </div>

                </Link>
            ))}
       </div>
    </div>
  );
};

export default MineGallery;