import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, CloudRain, ArrowRight } from 'lucide-react';
import { PageLoader, ErrorBanner } from './DataState';
import { useDiaryList } from '../hooks/queries/diary';
import { usePageCopy } from '../hooks/useSiteConfig';

const MineDiary: React.FC = () => {
  const { data: diaries = [], isLoading: loading, error: queryError } = useDiaryList({ limit: 500 });
  const error = queryError?.message ?? null;
  const pageCopy = usePageCopy();
  
  const shortDiaries = diaries.filter(d => d.type === 'SHORT');
  const longDiaries = diaries.filter(d => d.type === 'LONG');
  
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full bg-white dark:bg-[#050505] relative overflow-hidden flex flex-col min-h-screen">
      {loading && <PageLoader className="min-h-[600px]" />}
      
      {error && <ErrorBanner error={error} className="m-8" />}
      
      {!loading && !error && (
        <>
        {/* Header (Top) */}
        <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center z-10 bg-white/95 dark:bg-[#050505]/95 backdrop-blur">
             <div>
                <h2 className="text-3xl font-black font-sans text-ink dark:text-white">{pageCopy.diaryTitle}</h2>
                <span className="font-mono text-xs text-gray-400 tracking-[0.2em] uppercase">{pageCopy.diarySubtitle}</span>
             </div>
             <div className="text-right hidden md:block">
                 <div className="font-serif text-sm text-gray-500 italic">
                     "{pageCopy.diaryQuote}"
                 </div>
             </div>
        </div>

        {/* 1. Horizontal Stream (Micro-Notes) */}
        <div className="h-[500px] flex-shrink-0 border-b border-gray-100 dark:border-white/10">
            <div className="h-full overflow-x-auto overflow-y-hidden flex flex-row-reverse py-12 px-8 gap-16 items-start bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]">
                
                {/* Start Marker */}
                <div className="h-full flex flex-col justify-center items-center px-8 border-l border-ink/10 dark:border-white/10 opacity-50 select-none">
                    <span className="vertical-text font-serif text-2xl tracking-[0.5em] text-gray-300 dark:text-gray-600">
                        {pageCopy.diaryStartLabel}
                    </span>
                </div>

                {shortDiaries.map((entry, index) => (
                    <div 
                        key={entry.id}
                        className="flex-shrink-0 h-full w-24 md:w-32 relative group transition-all duration-500 hover:w-40"
                    >
                        {/* Hover Guide Line */}
                        <div className="absolute top-0 right-[-32px] w-[1px] h-full bg-gray-200 dark:bg-white/5 group-hover:bg-neon/50 transition-colors"></div>

                         <div className="h-full flex flex-col items-center py-4">
                             {/* Date Line */}
                             <div className="writing-vertical-rl font-mono text-xs text-gray-400 tracking-widest mb-8 border-l border-neon pl-2 h-24 flex items-center group-hover:text-neon transition-colors">
                                 {formatDate(entry.date)}
                             </div>
                             
                             {/* Main Text Content - Subtle Tilt that straightens */}
                             <div 
                                 className="flex-1 w-full writing-vertical-rl text-justify font-serif text-ink dark:text-gray-300 text-base md:text-lg leading-loose tracking-widest cursor-default group-hover:text-black dark:group-hover:text-white transition-all duration-500 origin-center"
                                 style={{ transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})` }} // Very subtle organic tilt
                             >
                                 <span className="group-hover:rotate-0 transition-transform duration-500 block">
                                     {entry.content}
                                 </span>
                             </div>
 
                             {/* CYBER SEAL (The Stamp - Matches ShadowFragments) */}
                             <div className="mt-8 relative">
                                 <div className={`
                                     relative w-14 h-14 flex items-center justify-center
                                     transition-transform duration-500 ease-out
                                     /* Initial aggressive tilt */
                                     -rotate-12 group-hover:rotate-0 group-hover:scale-110
                                 `}>
                                     {/* Outer Box (Thick) */}
                                     <div className="absolute inset-0 border-2 border-neon opacity-60 group-hover:opacity-100 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all"></div>
                                     
                                     {/* Inner Box (Thin/Offset) */}
                                     <div className="absolute inset-1 border border-neon opacity-30 group-hover:inset-1.5 group-hover:opacity-100 transition-all duration-500"></div>
                                     
                                     {/* Text */}
                                     <span className="font-mono text-[8px] font-black text-neon uppercase tracking-widest relative z-10 bg-white dark:bg-black px-1">
                                         {entry.stamp || 'NOTE'}
                                     </span>
 
                                     {/* Connecting Line (Decor) */}
                                     <div className="absolute -top-4 left-1/2 w-[1px] h-4 bg-neon/20 group-hover:h-0 transition-all"></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
 
         {/* 2. Long Form Diary (Cards) */}
         <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
             <h3 className="font-bold text-xl text-ink dark:text-white mb-8 flex items-center gap-2">
                 <div className="w-1 h-6 bg-neon"></div>
                 日记
                 <span className="text-xs font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded">{longDiaries.length} 篇日记</span>
             </h3>

             {longDiaries.length > 0 ? (
               longDiaries.map((diary) => (
                 <div key={diary.id} className="bg-white dark:bg-[#0a0a0a] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-neon transition-colors shadow-lg group mb-8">
                     
                     {/* Header */}
                     <div className="p-6 pb-4">
                         <h2 className="text-2xl font-black font-sans text-ink dark:text-white mb-1 group-hover:text-neon transition-colors">{diary.title}</h2>
                         {diary.subtitle && <p className="text-xs font-mono text-gray-400">{diary.subtitle}</p>}
                         
                         {/* Tags */}
                         {diary.tags && diary.tags.length > 0 && (
                           <div className="flex gap-4 mt-4">
                               {diary.mood && (
                                   <span className="flex items-center gap-1 text-xs text-[#f59e0b] font-mono">
                                       <Sun size={12} /> {diary.mood}
                                   </span>
                               )}
                               {diary.weather && (
                                   <span className="flex items-center gap-1 text-xs text-[#f43f5e] font-mono">
                                       <CloudRain size={12} /> {diary.weather}
                                   </span>
                               )}
                           </div>
                         )}
 
                         <div className="mt-4 font-mono text-sm text-gray-500">{formatDate(diary.date)}</div>
                     </div>
  
                     {/* Big Image */}
                     {diary.coverImage && (
                       <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden relative">
                           <img 
                               src={diary.coverImage} 
                               alt="Diary Cover" 
                               className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                           />
                           {/* Overlay Seal */}
                           <div className="absolute top-4 right-4">
                                <div className="w-16 h-16 border-4 border-white/20 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-all duration-500 backdrop-blur-sm">
                                     <span className="font-black text-white/50 text-xs tracking-widest">COVER</span>
                                </div>
                           </div>
                       </div>
                     )}
  
                      {/* Footer */}
                      <div className="bg-[#1a1a1a] p-4 flex justify-between items-center">
                          {diary.readingTime && <span className="text-xs font-mono text-gray-400">{diary.readingTime}</span>}
                          <Link to={`/diary/${diary.id}`} className="text-xs font-bold text-[#f472b6] flex items-center gap-1 hover:text-white transition-colors">
                              阅读全文 <ArrowRight size={12} />
                          </Link>
                      </div>
  
                 </div>
               ))
             ) : (
               <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                 <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                   暂无长日记
                 </span>
               </div>
             )}
         </div>
        </>
      )}
      </div>
   );
 };

export default MineDiary;