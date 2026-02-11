import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 inline-block backdrop-blur-sm">
      <Link to="/" className="hover:text-neon dark:hover:text-neon transition-colors flex items-center gap-1">
        <Home size={14} />
        首页
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          {item.href ? (
            <Link to={item.href} className="hover:text-neon dark:hover:text-neon transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink dark:text-gray-200 truncate max-w-xs">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;
