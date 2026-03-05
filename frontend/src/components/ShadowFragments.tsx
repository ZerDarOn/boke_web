import React, { useState, useEffect } from 'react';
import { diaryApi, Diary } from '../lib/api';
import { usePageCopy } from '../hooks/useSiteConfig';
import { Loader2 } from 'lucide-react';

const ShadowFragments: React.FC = () => {
  const pageCopy = usePageCopy();
  const [entries, setEntries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 API 获取日记列表
  useEffect(() => {
    const fetchDiaries = async () => {
      setLoading(true);
      try {
        const result = await diaryApi.getAll({ limit: 5, type: 'SHORT' });
        if (result.success && result.data) {
          setEntries(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch diaries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, []);

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit' 
      }).replace(/\//g, '.');
    } catch {
      return dateString;
    }
  };

  return (
    <section id="thoughts" className="py-24 border-t border-ink/10 dark:border-white/10 relative overflow-hidden w-full">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
         <span className="font-serif text-[10rem] leading-none select-none text-ink dark:text-white">{pageCopy.thoughtsBgText}</span>
      </div>

      <div className="w-full px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-sans font-bold text-ink dark:text-white">
            {pageCopy.thoughtsTitle}
          </h2>
          <span className="font-mono text-xs tracking-widest text-gray-500">
             // {pageCopy.thoughtsLabel}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-neon" size={32} />
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-lg font-serif">暂无内容</p>
          </div>
        )}

        {/* Horizontal Scroll Container for Vertical Cards */}
        {!loading && entries.length > 0 && (
          <div className="flex overflow-x-auto pb-12 gap-10 scrollbar-hide snap-x snap-mandatory px-4 py-4">
            {entries.slice(0, 5).map((entry, index) => (
              <div
                key={entry.id}
                className={`
                  flex-shrink-0 snap-center bg-white dark:bg-[#111]
                  shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none
                  w-48 h-[450px] p-6 relative group
                  transition-all duration-500 ease-out
                  border border-transparent dark:border-white/5
                  hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] dark:hover:border-neon/30
                  hover:rotate-0 hover:-translate-y-4 hover:z-10 hover:scale-105
                  ${index % 2 === 0 ? '-rotate-2' : 'rotate-1'}
                `}
              >
                {/* Top Neon Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-neon opacity-50 group-hover:opacity-100 transition-opacity"></div>

                {/* Date */}
                <div className="font-mono text-[10px] text-gray-400 absolute top-6 left-4 border-b border-gray-200 dark:border-white/10 pb-2 w-8 group-hover:text-neon transition-colors">
                  {formatDate(entry.date)}
                </div>

                {/* Vertical Text Content */}
                <div className="h-full w-full flex flex-row-reverse justify-center pt-16 pb-24">
                  <p
                    className={`vertical-text font-serif text-base text-ink dark:text-gray-300 leading-loose tracking-widest border-l border-gray-100 dark:border-white/10 pl-4 h-full overflow-hidden text-ellipsis transition-all duration-500 ease-out group-hover:text-black dark:group-hover:text-white group-hover:border-neon/30 group-hover:scale-110 group-hover:rotate-0 ${index % 2 === 0 ? '-rotate-6' : 'rotate-6'}`}
                  >
                    {entry.content}
                  </p>
                </div>

                {/* CYBER SEAL */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className={`
                    relative w-14 h-14 flex items-center justify-center
                    transition-transform duration-500 ease-spring
                    rotate-12 group-hover:rotate-0 group-hover:scale-110
                  `}>
                    {/* Outer Box */}
                    <div className="absolute inset-0 border-2 border-neon opacity-80 group-hover:opacity-100 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all"></div>
                    
                    {/* Inner Box */}
                    <div className="absolute inset-1 border border-neon opacity-40 group-hover:inset-1.5 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    {/* Text */}
                    <span className="font-mono text-[10px] font-black text-neon uppercase tracking-wider relative z-10 group-hover:text-ink dark:group-hover:text-white bg-white/0 dark:bg-black/0 px-1">
                      {entry.stamp}
                    </span>

                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 bg-neon opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShadowFragments;
