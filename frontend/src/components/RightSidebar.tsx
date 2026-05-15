import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Activity, Rss, ArrowRight, Copy, CheckCircle2, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { usePageCopy } from '../hooks/useSiteConfig';
import useActivities from '../hooks/useActivities';

const RightSidebar: React.FC = () => {
  const [rssCopied, setRssCopied] = useState(false);
  const [rssUrl, setRssUrl] = useState('');
  const { activities, loading } = useActivities({ limit: 5 });
  const pageCopy = usePageCopy();

  useEffect(() => {
    setRssUrl(`${window.location.origin}/rss.xml`);
  }, []);

  const copyRss = () => {
    navigator.clipboard.writeText(rssUrl);
    setRssCopied(true);
    setTimeout(() => setRssCopied(false), 2000);
  };

  return (
    <aside className="hidden xl:flex flex-col gap-6 w-72 flex-shrink-0 sticky top-24 h-fit z-20">
      
      {/* 1. 公告卡片 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-black/30 transition-all duration-300 hover:shadow-neon/10 hover:-translate-y-1">
        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon via-neon-dark to-neon"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-neon/5 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-1 h-12 bg-gradient-to-t from-neon/20 to-transparent"></div>
        
        <div className="p-5 relative">
          <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon/20 to-neon/5 flex items-center justify-center">
              <Bell size={16} className="text-neon" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {pageCopy.announcementTitle}
            </span>
          </h4>
          <p className="font-serif text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {pageCopy.announcementContent}
          </p>
          <Link 
            to={pageCopy.announcementLink}
            className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 hover:from-blue-100 dark:hover:from-blue-900/40 text-blue-600 dark:text-blue-400 font-mono text-xs py-2.5 rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20"
          >
            {pageCopy.announcementLinkText} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. 最新动态 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-black/30 transition-all duration-300 hover:shadow-neon/10 hover:-translate-y-1">
        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon via-neon-dark to-neon"></div>
        <div className="absolute bottom-0 right-0 w-1 h-12 bg-gradient-to-t from-neon/20 to-transparent"></div>
        
        <div className="p-5 relative">
          <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon/20 to-neon/5 flex items-center justify-center">
              <Activity size={16} className="text-neon" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              最新动态
            </span>
          </h4>
          
          {/* 内容显示 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-4 h-4 animate-spin text-neon" />
              <span className="text-xs text-gray-400 ml-2">加载中...</span>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {activities.slice(0, 5).map((item, idx) => (
                <Link
                  key={item.id}
                  to="/projects"
                  className="group relative pl-6 pb-3 block last:pb-0"
                >
                  {/* 时间线 */}
                  {idx !== activities.slice(0, 5).length - 1 && (
                    <div className="absolute left-[11px] top-6 h-full w-[1px] bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent"></div>
                  )}
                  
                  {/* 点 */}
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1a1a1a] transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-neon/30">
                    <div className={`w-full h-full rounded-full ${
                      item.status === 'DONE' 
                        ? 'bg-neon' 
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                    }`}></div>
                  </div>
                  
                  {/* 内容卡片 */}
                  <div className="relative bg-gray-50 dark:bg-white/5 p-3 rounded-lg hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-white/10 dark:hover:to-white/5 hover:shadow-md transition-all duration-300 group-hover:shadow-neon/5 group-hover:-translate-y-0.5">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-xs text-ink dark:text-gray-200 truncate max-w-[140px]">{item.project || '未命名项目'}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : item.status === 'DONE'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                        {item.status === 'IN_PROGRESS' ? '进行中' : item.status === 'DONE' ? '已完成' : '计划中'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">{item.title || '无标题'}</p>
                    
                    {/* 日期 */}
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono mb-2">{item.date}</p>
                    
                    {/* 标签 */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(t => (
                          <span key={t} className="text-[9px] text-neon/80 dark:text-neon/70 bg-neon/5 dark:bg-neon/10 px-1.5 py-0.5 rounded font-mono border border-neon/20 dark:border-neon/10">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">暂无动态</p>
          )}
        </div>
      </div>

      {/* 3. RSS 订阅 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-black/30 transition-all duration-300 hover:shadow-neon/10 hover:-translate-y-1">
        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon via-neon-dark to-neon"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-1 h-12 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
        
        <div className="p-5 relative">
          <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
              <Rss size={16} className="text-orange-500 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              RSS 订阅
            </span>
          </h4>
          
          <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
            通过 RSS 阅读器订阅，及时获取最新文章推送
          </p>
          
          {/* RSS URL */}
          <div className="relative mb-3">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2 group hover:border-neon/30 dark:hover:border-neon/30 transition-all duration-300">
              <input 
                type="text" 
                value={rssUrl}
                readOnly
                className="bg-transparent text-[10px] text-gray-600 dark:text-gray-300 w-full outline-none font-mono truncate"
              />
              <button 
                onClick={copyRss}
                className={`relative p-1.5 rounded transition-all duration-300 ${
                  rssCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                }`}
                title={rssCopied ? "已复制" : "复制链接"}
              >
                {rssCopied ? (
                  <CheckCircle2 size={14} className="animate-pulse" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            
            {/* 复制成功提示 */}
            {rssCopied && (
              <div className="absolute -top-8 right-0 bg-neon text-white text-[10px] px-2 py-1 rounded-full font-mono animate-bounce shadow-lg shadow-neon/30">
                ✓ 已复制
              </div>
            )}
          </div>
          
          {/* 常见阅读器 */}
          <div className="text-[9px] text-gray-400 dark:text-gray-500 mb-2 font-mono">推荐阅读器</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { name: 'Feedly', icon: '📰', url: 'https://feedly.com' },
              { name: 'Inoreader', icon: '📬', url: 'https://inoreader.com' },
              { name: 'NetNewsWire', icon: '🗞️', url: 'https://netnewswire.com' }
            ].map((reader) => (
              <button
                key={reader.name}
                onClick={() => window.open(reader.url, '_blank')}
                className="p-1.5 bg-gray-100 dark:bg-white/10 hover:bg-neon/10 dark:hover:bg-neon/10 rounded transition-all duration-300 hover:scale-110 group"
                title={reader.name}
              >
                <span className="text-sm">{reader.icon}</span>
              </button>
            ))}
          </div>
          
          {/* 说明文字 */}
          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono leading-relaxed">
            复制上方链接，添加到任意 RSS 阅读器订阅
          </p>
        </div>
      </div>

    </aside>
  );
};

export default RightSidebar;