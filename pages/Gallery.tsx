import React from 'react';
import { Link } from 'react-router-dom';
import { GALLERY_ALBUMS } from '../constants';
import { Camera, Calendar, MapPin, Image as ImageIcon } from 'lucide-react';

const Gallery: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="w-full bg-white dark:bg-[#0a0a0a] p-6 min-h-[600px] transition-colors">

        <div className="mb-12 border-l-4 border-ink dark:border-white pl-6 py-2">
          <h2 className="text-4xl font-black font-sans text-ink dark:text-white mb-1">GALLERY.ALBUMS</h2>
          <p className="font-mono text-xs text-neon uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={12} /> Photo Collections
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {GALLERY_ALBUMS.map((album) => (
            <Link
              key={album.id}
              to={`/gallery/${album.id}`}
              className="break-inside-avoid block relative group bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 p-3 shadow-sm hover:shadow-xl dark:hover:border-neon/50 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="aspect-[4/3] relative bg-gray-100 dark:bg-[#050505] overflow-hidden">
                <div
                  style={{ backgroundColor: album.cover }}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-full h-[2px] bg-neon shadow-[0_0_20px_#10b981] transform -rotate-12 scale-x-0 group-hover:scale-x-150 transition-transform duration-500 delay-100"></div>
                </div>

                <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="mt-4 flex justify-between items-end opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <h3 className="font-sans font-bold text-lg text-ink dark:text-white group-hover:text-neon transition-colors">
                    {album.title}
                  </h3>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {album.lastUpdated}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {album.location}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs text-gray-300 dark:text-gray-600 group-hover:text-ink dark:group-hover:text-white font-bold flex items-center gap-1">
                  <ImageIcon size={12} />
                  {album.photoCount}
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Gallery;
