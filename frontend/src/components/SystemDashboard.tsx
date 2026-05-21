import React, { useState, useEffect } from 'react';
import { Database, Activity, Camera, Book, ArrowUpRight, MessageSquare, Heart, Star, PieChart, Loader2, Terminal, Lock } from 'lucide-react';
import { maintenanceApi } from '../lib/maintenance';
import {
  useDashboardStats,
  useDashboardPopular,
  useDashboardContentDistribution,
} from '../hooks/queries/dashboard';
import { useLang } from '../contexts/LangContext';

const SystemDashboard: React.FC = () => {
  const { t } = useLang();

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: popularContent, isLoading: popularLoading } = useDashboardPopular();
  const { data: contentDistribution, isLoading: distributionLoading } = useDashboardContentDistribution();
  const loading = statsLoading || popularLoading || distributionLoading;
  const error = statsError?.message ?? null;
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await maintenanceApi.getStatus();
        setMaintenanceMode(response.enabled);
      } catch (err) {
        console.error('Failed to check maintenance mode:', err);
      }
    };
    checkMaintenanceMode();
  }, []);
  return (
    <div className="w-full p-2 md:p-6">
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-red-600 dark:text-red-300 font-mono text-sm">
            ERROR: {error}
          </p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min">

         {/* Module 1: System Vitals (Row 1 - Full Width) */}
         <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group rounded-lg">
             <div className="absolute top-0 left-0 w-1 h-full bg-ink dark:bg-white group-hover:bg-neon transition-colors duration-500"></div>
             <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Activity size={14} /> {t.SYSTEM_VITALS}
             </h3>
             
             <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                 <div>
                     <div className="font-sans font-black text-4xl md:text-6xl text-ink dark:text-white tracking-tighter mb-2">
                         {stats?.uptime || '0d 00h 00m'}
                     </div>
                     <span className="text-[10px] font-mono text-gray-400">{t.UPTIME_LABEL}</span>
                 </div>
                 
                 <div className="w-full lg:w-1/3 space-y-4">
                     <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                         <span className="font-mono text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                             <Database size={12} /> {t.DB_CONNECTION}
                         </span>
                         <span className="font-mono text-xs text-neon font-bold flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
                             {t.STABLE}
                         </span>
                     </div>
                     <div>
                         <div className="flex justify-between text-[10px] font-mono mb-1">
                             <span className="text-gray-500">{t.STORAGE_USAGE}</span>
                             <span className="text-ink dark:text-white font-bold">24%</span>
                         </div>
                         <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-neon w-[24%] shadow-[0_0_10px_#10b981]"></div>
               </div>
          </div>
             </div>
         </div>

         {/* Module 2: Traffic Intelligence (Row 2 - Left Half) */}
         <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-neon/50 transition-colors rounded-lg">
             <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">{t.TOTAL_REQUESTS}</h3>
             <div>
                 <div className="font-sans font-black text-5xl text-ink dark:text-white mb-4">
                   {stats?.totalRequests?.toLocaleString() || '84,100'}
                 </div>
                  <div className="h-12 w-full flex items-end gap-1">
                      {[
                        (stats?.totalRequests || 84100) * 0.20,
                        (stats?.totalRequests || 84100) * 0.35,
                        (stats?.totalRequests || 84100) * 0.40,
                        (stats?.totalRequests || 84100) * 0.30,
                        (stats?.totalRequests || 84100) * 0.45,
                        (stats?.totalRequests || 84100) * 0.50,
                        (stats?.totalRequests || 84100) * 0.65,
                        (stats?.totalRequests || 84100) * 0.55,
                        (stats?.totalRequests || 84100) * 0.70,
                        (stats?.totalRequests || 84100) * 0.60,
                        (stats?.totalRequests || 84100) * 0.80,
                        (stats?.totalRequests || 84100) * 0.75
                      ].map((h, i) => (
                          <div key={i} className="flex-1 bg-neon/20 hover:bg-neon transition-colors" style={{ height: `${Math.min(h, 100)}%` }}></div>
                      ))}
                 </div>
                 <div className="flex items-center gap-1 mt-3 text-[10px] text-green-600 font-mono">
                     <ArrowUpRight size={10} /> +12.5% {t.THIS_WEEK}
                 </div>
              </div>
          </div>

          {/* Module 3: Visitors (Row 2 - Right Half) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-neon/50 transition-colors rounded-lg">
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">{t.UNIQUE_VISITORS}</h3>
            <div>
                <div className="font-sans font-black text-5xl text-ink dark:text-white mb-4">
                  {stats?.uniqueVisitors?.toLocaleString() || '24.5K'}
                 </div>
                  <div className="flex items-center -space-x-3 mt-4">
                       {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">U{i}</div>
                       ))}
                       <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-ink dark:bg-white text-white flex items-center justify-center text-[10px] font-bold">+</div>
                 </div>
             </div>
          </div>

         {/* Module 9: Interaction Data (Row 3 - Full Width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-neon/50 transition-colors rounded-lg">
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Heart size={14} /> {t.INTERACTIONS}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-lg">
                     <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                             <Heart size={18} className="text-pink-400" />
                             <span className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.LIKES}</span>
                         </div>
                         <span className="font-sans font-black text-3xl text-ink dark:text-white">
                             {stats?.contentStats?.totalLikes?.toLocaleString() || '0'}
                         </span>
                     </div>
                      <div className="flex items-center gap-1 text-[10px] text-green-600 font-mono">
                          <ArrowUpRight size={10} /> +{((stats?.contentStats?.totalLikes || 0) / (stats?.totalRequests || 1) * 100).toFixed(1)}% {t.THIS_MONTH}
                      </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Star size={18} className="text-amber-400" />
                              <span className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.FAVORITES}</span>
                          </div>
                          <span className="font-sans font-black text-3xl text-ink dark:text-white">
                              {stats?.contentStats?.totalFavorites?.toLocaleString() || '0'}
                          </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-green-600 font-mono">
                          <ArrowUpRight size={10} /> +{((stats?.contentStats?.totalFavorites || 0) / (stats?.totalRequests || 1) * 100).toFixed(1)}% {t.THIS_MONTH}
                      </div>
                  </div>
              </div>
              </div>
         </div>

          {/* Module 4: Asset Inventory (Row 4 - Full Row) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
               {stats?.contentStats && [
                   { label: t.TOTAL_ARTICLES, count: stats?.contentStats?.articles || 0, icon: Book },
                   { label: t.PHOTOS_STORED, count: stats?.contentStats?.photos || 0, icon: Camera },
                   { label: t.DIARY_ENTRIES_LABEL, count: stats?.contentStats?.diaries || 0, icon: Book },
               ].map((asset, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#0a0a0a] p-5 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between hover:translate-y-[-2px] transition-transform rounded-lg">
                       <div>
                            <div className="text-3xl font-black font-sans text-ink dark:text-white">{asset.count}</div>
                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{asset.label}</div>
                       </div>
                       <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-ink dark:text-white group-hover:text-neon">
                            <asset.icon size={20} />
                       </div>
                  </div>
              ))}
         </div>

         {/* Module 5: Content Distribution (Row 5 - Left Half) */}
         <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-neon/50 transition-colors rounded-lg">
             <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <PieChart size={14} /> {t.CONTENT_DISTRIBUTION}
             </h3>
             <div className="flex items-center gap-8">
                 {/* Pie Chart */}
                 <div className="relative w-32 h-32 flex-shrink-0">
                     <div
                         className="w-full h-full rounded-full"
                         style={{
                             background: `conic-gradient(
                                 var(--color-neon) 0deg 180deg,
                                 #f472b6 180deg 270deg,
                                 #f59e0b 270deg 315deg,
                                 #8b5cf6 315deg 360deg
                             )`
                         }}
                     />
                     {/* Center Hole */}
                     <div className="absolute inset-4 bg-white dark:bg-[#0a0a0a] rounded-full"></div>
                     {/* Total Count */}
                     <div className="absolute inset-0 flex items-center justify-center">
                         <span className="font-sans font-black text-xl text-ink dark:text-white">
                             {stats?.contentStats?.totalContent?.toLocaleString() || '0'}
                         </span>
                     </div>
                 </div>
                 
                 {/* Legend */}
                  <div className="flex-1 space-y-2">
                      {Array.isArray(contentDistribution) && contentDistribution.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                  <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                              </div>
                              <span className="font-sans font-bold text-sm text-ink dark:text-white">{item.count}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Module 6: Comment Statistics (Row 5 - Middle) */}
         <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:border-neon/50 transition-colors rounded-lg">
             <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <MessageSquare size={14} /> {t.COMMENTS_LABEL}
             </h3>
             <div className="flex items-center gap-8">
                 {/* Pie Chart */}
                 <div className="relative w-32 h-32 flex-shrink-0">
                     <div
                         className="w-full h-full rounded-full"
                         style={{
                             background: `conic-gradient(
                                 var(--color-neon) 0deg 244.8deg,
                                 #f472b6 244.8deg 313.2deg,
                                 #f59e0b 313.2deg 360deg
                             )`
                         }}
                     />
                     {/* Center Hole */}
                     <div className="absolute inset-4 bg-white dark:bg-[#0a0a0a] rounded-full"></div>
                     {/* Total Count */}
                     <div className="absolute inset-0 flex items-center justify-center">
                         <span className="font-sans font-black text-xl text-ink dark:text-white">
                             {stats?.contentStats?.totalComments?.toLocaleString() || '1,247'}
                         </span>
                     </div>
                 </div>
                 
                 {/* Legend */}
                  <div className="flex-1 space-y-2">
                       {Array.isArray(stats?.commentDistribution) && stats.commentDistribution.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                  <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                              </div>
                              <span className="font-sans font-bold text-sm text-ink dark:text-white">{item.count}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Module 7: Popular Content (Row 6 - Half) */}
         <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-0 border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col rounded-lg">
             <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                  <h3 className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t.TOP_5_PAGES}</h3>
                  <span className="text-[10px] text-neon border border-neon px-1.5 rounded bg-neon/5">{t.LIVE}</span>
             </div>
              <div className="flex-1">
                  {Array.isArray(popularContent?.posts) && popularContent.posts.slice(0, 5).map((post, idx) => (
                     <div key={post.id} className="group flex items-center gap-4 p-4 border-b border-gray-100 dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors relative">
                         <div className="font-mono text-lg font-bold text-neon/40 group-hover:text-neon transition-colors w-8">
                             0{idx + 1}
                         </div>
                         <div className="flex-1">
                             <h4 className="font-sans font-bold text-sm text-gray-800 dark:text-white group-hover:text-ink dark:group-hover:text-neon line-clamp-1">
                                 {post.title}
                             </h4>
                             <span className="text-[10px] font-mono text-gray-400">{post.category} • {post.viewCount?.toLocaleString() || '0'} Views</span>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowUpRight size={16} className="text-ink dark:text-white" />
                         </div>
                         <div className="absolute bottom-0 left-0 h-[1px] bg-neon w-0 group-hover:w-full transition-all duration-300"></div>
                     </div>
                  ))}
              </div>
          </div>

          {/* Module 8: Maintenance (Row 6 - Half) */}
         <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-ink dark:bg-white/10 text-white p-8 flex flex-col justify-center items-center text-center relative overflow-hidden rounded-lg">
              {/* Abstract Background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <Lock className={maintenanceMode ? 'text-neon' : 'text-gray-400'} size={32} />
                <div className="text-left">
                  <h3 className="text-xl font-black font-sans mb-1">
                    {t.MAINTENANCE_MODE}
                  </h3>
                  <p className={`text-xs font-mono ${maintenanceMode ? 'text-neon' : 'text-gray-400'}`}>
                    {maintenanceMode ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                  </p>
                </div>
              </div>
              <p className="text-xs font-mono text-gray-400 relative z-10 mb-6 max-w-xs">
                  {t.MAINTENANCE_DESC}
              </p>
              <button 
                onClick={() => window.location.href = '/maintenance'}
                className="relative z-10 px-6 py-2 border border-white/20 text-xs font-mono hover:bg-white hover:text-ink transition-colors uppercase flex items-center gap-2"
              >
                  <Terminal size={14} />
                  {t.VIEW_LOG}
              </button>
         </div>

      </div>
      )}
    </div>
  );
};

export default SystemDashboard;
