import React from 'react';
import { Clock, Database, HardDrive, Activity, Users, Eye, Image, Camera, Book, ArrowUpRight } from 'lucide-react';
import { BLOG_POSTS } from '../constants';

const SystemDashboard: React.FC = () => {
  return (
    <div className="w-full p-2 md:p-6 bg-gray-50 dark:bg-white/5 rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
        
        {/* Module 1: System Vitals (Row 1 - Full Width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group rounded-lg">
            <div className="absolute top-0 left-0 w-1 h-full bg-ink dark:bg-white group-hover:bg-neon transition-colors duration-500"></div>
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} /> System Vitals
            </h3>
            
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
                <div>
                    <div className="font-sans font-black text-4xl md:text-6xl text-ink dark:text-white tracking-tighter mb-2">
                        124d 08h 32m
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">CURRENT SESSION UPTIME</span>
                </div>
                
                <div className="w-full lg:w-1/3 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Database size={12} /> DB_CONNECTION
                        </span>
                        <span className="font-mono text-xs text-neon font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
                            STABLE
                        </span>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                            <span className="text-gray-500">STORAGE USAGE</span>
                            <span className="text-ink dark:text-white font-bold">24%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-neon w-[24%] shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Module 2: Traffic Intelligence (Row 2 - Left Half) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-neon/50 transition-colors rounded-lg">
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">Total Requests</h3>
            <div>
                <div className="font-sans font-black text-5xl text-ink dark:text-white mb-4">842.1K</div>
                <div className="h-12 w-full flex items-end gap-1">
                    {/* CSS Sparkline bars */}
                    {[20, 35, 40, 30, 45, 50, 65, 55, 70, 60, 80, 75, 40, 50, 60, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-neon/20 hover:bg-neon transition-colors" style={{ height: `${h}%` }}></div>
                    ))}
                </div>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-green-600 font-mono">
                    <ArrowUpRight size={10} /> +12.5% THIS WEEK
                </div>
            </div>
        </div>

        {/* Module 3: Visitors (Row 2 - Right Half) */}
         <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:border-neon/50 transition-colors rounded-lg">
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">Unique Visitors</h3>
            <div>
                <div className="font-sans font-black text-5xl text-ink dark:text-white mb-4">24.5K</div>
                 <div className="flex items-center -space-x-3 mt-4">
                     {[1,2,3,4,5,6].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">U{i}</div>
                     ))}
                     <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0a0a0a] bg-ink dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold">+99</div>
                 </div>
            </div>
        </div>

        {/* Module 4: Asset Inventory (Row 3 - Full Row) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
                 { label: 'Total Albums', count: '12', icon: Image },
                 { label: 'Photos Stored', count: '1,024', icon: Camera },
                 { label: 'Diary Entries', count: '365', icon: Book },
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

        {/* Module 5: Popular Content (Row 4 - Half) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-[#0a0a0a] p-0 border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col rounded-lg">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                 <h3 className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">TOP 5 POPULAR PAGES</h3>
                 <span className="text-[10px] text-neon border border-neon px-1.5 rounded bg-neon/5">LIVE</span>
            </div>
            <div className="flex-1">
                {BLOG_POSTS.slice(0, 5).map((post, idx) => (
                    <div key={post.id} className="group flex items-center gap-4 p-4 border-b border-gray-100 dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors relative">
                        <div className="font-mono text-lg font-bold text-neon/40 group-hover:text-neon transition-colors w-8">
                            0{idx + 1}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-sans font-bold text-sm text-gray-800 dark:text-white group-hover:text-ink dark:group-hover:text-neon line-clamp-1">
                                {post.title}
                            </h4>
                            <span className="text-[10px] font-mono text-gray-400">{post.category} • {Math.floor(Math.random() * 5000) + 1000} Views</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={16} className="text-ink dark:text-white" />
                        </div>
                        {/* Hover Flash Underline */}
                        <div className="absolute bottom-0 left-0 h-[1px] bg-neon w-0 group-hover:w-full transition-all duration-300"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* Module 6: Maintenance (Row 4 - Half) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-ink dark:bg-white/10 text-white p-8 flex flex-col justify-center items-center text-center relative overflow-hidden rounded-lg">
             {/* Abstract Background */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
             <h3 className="text-2xl font-black font-sans relative z-10 mb-2">MAINTENANCE MODE</h3>
             <p className="text-xs font-mono text-gray-400 relative z-10 mb-6 max-w-xs">
                 Scheduled system optimization occurs every Sunday at 03:00 AM UTC.
             </p>
             <button className="relative z-10 px-6 py-2 border border-white/20 text-xs font-mono hover:bg-white hover:text-ink transition-colors uppercase">
                 View Log
             </button>
        </div>

      </div>
    </div>
  );
};

export default SystemDashboard;