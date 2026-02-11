import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  date?: string;
  subtitle?: string;
}

interface PrevNextNavigationProps {
  prev?: NavigationItem | null;
  next?: NavigationItem | null;
}

const PrevNextNavigation: React.FC<PrevNextNavigationProps> = ({ prev, next }) => {
  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prev && (
          <Link
            to={prev.href}
            className="group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-neon hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                <ArrowLeft size={20} className="text-gray-400 group-hover:text-neon transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-neon transition-colors">上一篇</p>
                <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:translate-x-1 transition-transform">{prev.title}</p>
                {prev.date && <p className="text-xs text-gray-400 font-mono mt-1">{prev.date}</p>}
                {prev.subtitle && <p className="text-xs text-gray-400 font-mono mt-1">{prev.subtitle}</p>}
              </div>
            </div>
          </Link>
        )}

        {next && (
          <Link
            to={next.href}
            className={`group relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6 hover:border-neon hover:shadow-lg transition-all duration-300 overflow-hidden ${!prev ? 'md:col-start-2' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3 justify-end">
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-gray-500 font-mono mb-1 group-hover:text-neon transition-colors">下一篇</p>
                <p className="font-sans font-bold text-ink dark:text-white truncate group-hover:-translate-x-1 transition-transform">{next.title}</p>
                {next.date && <p className="text-xs text-gray-400 font-mono mt-1">{next.date}</p>}
                {next.subtitle && <p className="text-xs text-gray-400 font-mono mt-1">{next.subtitle}</p>}
              </div>
              <div className="flex-shrink-0 w-10 h-10 bg-ink/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                <ArrowRight size={20} className="text-gray-400 group-hover:text-neon transition-colors" />
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PrevNextNavigation;
