import React, { useEffect, useState } from 'react';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const items: TocItem[] = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2];
      const id = title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
      items.push({ id, title, level });
    }

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`sticky top-28 bg-gradient-to-br from-white via-white to-gray-50 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#0d0d0d] border border-gray-200/50 dark:border-white/5 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/30 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-12' : 'w-full lg:w-52'
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-2.5 flex items-center justify-center hover:bg-gradient-to-r hover:from-neon/5 hover:to-neon/10 dark:hover:from-neon/10 dark:hover:to-neon/20 transition-all duration-200 border-b border-gray-100 dark:border-white/5 group"
        title={isCollapsed ? '展开目录' : '收起目录'}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 group-hover:from-neon/10 group-hover:to-neon/20 transition-all duration-200 ${
          isCollapsed ? 'rotate-0' : '-rotate-180'
        }`}>
          <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-neon transition-colors" />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}
      >
        <div className="p-4">
          <h3 className="text-base font-bold text-ink dark:text-white mb-3 flex items-center gap-2 font-sans">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon/20 to-neon/5 flex items-center justify-center shadow-sm shadow-neon/20">
              <List size={16} className="text-neon" />
            </div>
            <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              目录
            </span>
          </h3>
          <nav className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`group relative block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeId === item.id
                    ? 'bg-gradient-to-r from-neon/10 to-neon/5 border border-neon/20 text-neon shadow-sm shadow-neon/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-neon dark:hover:text-neon border border-transparent hover:border-gray-200/50 dark:hover:border-white/5'
                }`}
                style={{ paddingLeft: `${12 + (item.level - 1) * 16}px` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    activeId === item.id ? 'bg-neon shadow-lg shadow-neon/50' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-neon/50'
                  }`} />
            <span className="text-xs font-medium font-sans truncate">{item.title}</span>
                </div>
                {activeId === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-neon to-transparent rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TableOfContents;
