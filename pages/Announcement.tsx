import React from 'react';
import { ANNOUNCEMENTS, TRANSLATIONS } from '../constants';
import { Info, AlertTriangle, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const Announcement: React.FC = () => {
  const lang: 'EN' | 'ZH' = 'ZH';
  const t = TRANSLATIONS[lang];

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return <Info size={20} className="text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'SUCCESS':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'IMPORTANT':
        return <AlertCircle size={20} className="text-red-500" />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'INFO':
        return 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10';
      case 'WARNING':
        return 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'SUCCESS':
        return 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10';
      case 'IMPORTANT':
        return 'border-red-500/30 bg-red-50/50 dark:bg-red-900/10';
    }
  };

  return (
    <section className="py-12 w-full relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b-2 border-ink dark:border-white pb-4 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
          <h2 className="text-4xl md:text-6xl font-serif font-black text-ink dark:text-white tracking-tight leading-none">
            公告
          </h2>
          <span className="font-mono text-neon font-bold text-lg">
            / ANNOUNCEMENT
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {ANNOUNCEMENTS.map((announcement) => (
          <article
            key={announcement.id}
            className={`
              relative transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-white/10 rounded-lg p-6
              ${getTypeColor(announcement.type)}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(announcement.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold font-sans text-ink dark:text-white">
                    {announcement.title}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-mono rounded border border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={10} />
                    {announcement.date}
                  </span>
                </div>
                <p className="font-serif text-gray-600 dark:text-gray-300 leading-relaxed">
                  {announcement.content}
                </p>
              </div>
            </div>

            <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg opacity-50" style={{
              backgroundColor: announcement.type === 'INFO' ? '#3b82f6' :
                             announcement.type === 'WARNING' ? '#eab308' :
                             announcement.type === 'SUCCESS' ? '#22c55e' :
                             '#ef4444'
            }}></div>
          </article>
        ))}
      </div>

      {ANNOUNCEMENTS.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="font-mono text-lg">暂无公告</p>
        </div>
      )}
    </section>
  );
};

export default Announcement;
