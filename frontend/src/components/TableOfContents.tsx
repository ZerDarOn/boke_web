import React, { useEffect, useState } from 'react';
import { List, X } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);

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

    const headings = document.querySelectorAll('[data-article-content] h1, [data-article-content] h2, [data-article-content] h3');
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
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="关闭目录"
          className="fixed inset-0 z-40 cursor-default bg-ink/10 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="article-table-of-contents"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-white/95 px-4 py-3 text-sm font-mono font-medium text-ink shadow-xl shadow-ink/15 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-neon hover:text-neon dark:bg-[#151515]/95 dark:text-white dark:shadow-black/40 lg:bottom-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2"
        title="打开目录"
      >
        <List size={16} aria-hidden="true" />
        <span>目录</span>
      </button>
      <aside
        id="article-table-of-contents"
        aria-label="文章目录"
        className={`fixed inset-x-4 bottom-4 z-50 max-h-[min(34rem,70vh)] overflow-hidden rounded-2xl border border-gray-200/70 bg-gradient-to-br from-white via-white to-gray-50 shadow-2xl shadow-ink/20 transition-all duration-300 dark:border-white/10 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#0d0d0d] dark:shadow-black/50 lg:inset-x-auto lg:bottom-auto lg:right-6 lg:top-24 lg:w-80 ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0 lg:translate-x-4 lg:translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/5">
          <h3 className="flex items-center gap-2 font-sans text-base font-bold text-ink dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10 text-neon">
              <List size={16} aria-hidden="true" />
            </span>
            目录
          </h3>
          <button
            type="button"
            aria-label="关闭目录"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-neon dark:text-gray-400 dark:hover:bg-white/10"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-3">
          <nav className="max-h-[min(26rem,55vh)] space-y-1 overflow-y-auto pr-1 custom-scrollbar">
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
                  <span className="truncate text-sm font-medium font-sans">{item.title}</span>
                </div>
                {activeId === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-neon to-transparent rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default TableOfContents;
