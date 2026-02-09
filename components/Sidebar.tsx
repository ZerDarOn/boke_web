import React from 'react';
import { User, Github, Twitter, Hash } from 'lucide-react';
import { CATEGORIES, TAGS } from '../constants';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col gap-6 w-64 flex-shrink-0 sticky top-24 h-fit z-20">
      
      {/* 1. Avatar Card */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_rgba(10,10,10,0.1)] dark:shadow-none hover:shadow-[6px_6px_0px_rgba(16,185,129,0.2)] transition-all duration-300 rounded-lg relative overflow-hidden group">
        <div className="w-20 h-20 rounded-full bg-ink dark:bg-black border-2 border-neon p-1 mb-3 relative">
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                <User className="text-gray-500 w-10 h-10" />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-neon rounded-full border-2 border-white dark:border-black animate-pulse"></div>
        </div>
        <h3 className="font-sans font-bold text-lg text-ink dark:text-white transition-colors">CYBER.RONIN</h3>
        <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mb-4 tracking-widest uppercase">Fullstack Alchemist</p>
        <div className="flex gap-4 text-ink dark:text-gray-300">
            <Github size={16} className="hover:text-neon cursor-pointer transition-colors" />
            <Twitter size={16} className="hover:text-neon cursor-pointer transition-colors" />
        </div>
      </div>

      {/* 2. Categories */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
            <Hash size={14} className="text-neon" />
            CATEGORIES
        </h4>
        <ul className="space-y-2">
            {CATEGORIES.map((cat) => (
                <li key={cat.name} className="flex justify-between items-center group cursor-pointer p-1 hover:bg-gray-50 dark:hover:bg-white/5 rounded transition-colors">
                    <span className="flex items-center gap-2 font-mono text-xs text-gray-600 dark:text-gray-400 group-hover:text-ink dark:group-hover:text-white">
                        <span className="opacity-50 grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span>
                        {cat.name}
                    </span>
                    <span className="font-mono text-[10px] bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded group-hover:bg-neon group-hover:text-white transition-colors">
                        {cat.count}
                    </span>
                </li>
            ))}
        </ul>
      </div>

      {/* 3. Tags */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-lg shadow-sm">
        <h4 className="font-sans font-bold text-sm text-ink dark:text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
            <Hash size={14} className="text-neon" />
            TAGS
        </h4>
        <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
                <span 
                    key={tag} 
                    className="font-mono text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded cursor-pointer hover:border-neon hover:text-neon transition-all"
                >
                    #{tag}
                </span>
            ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;