import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';

function headingId(children: ReactNode) {
  return String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
}

export function createContentMarkdownComponents(paragraphClass: string): Components {
  return {
    h1: ({ children }) => (
      <h1
        id={headingId(children)}
        className="text-3xl md:text-4xl font-serif font-bold text-ink dark:text-white mt-8 mb-4 pb-2 border-b-2 border-neon/30 scroll-mt-24"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-white/10 scroll-mt-24"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={headingId(children)}
        className="text-xl md:text-2xl font-serif font-bold text-ink dark:text-white mt-5 mb-2 scroll-mt-24"
      >
        {children}
      </h3>
    ),
    p: ({ children }) => <p className={paragraphClass}>{children}</p>,
    ul: ({ children }) => (
      <ul className="space-y-2 mb-4 ml-6 list-disc marker:text-neon">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 mb-4 ml-6 list-decimal marker:text-neon">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-base leading-relaxed text-ink dark:text-gray-200 pl-2">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-neon pl-4 py-2 my-4 bg-gray-50/50 dark:bg-white/5 italic text-gray-700 dark:text-gray-300">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-neon hover:text-neon/80 underline decoration-neon/30 hover:decoration-neon transition-all"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-ink dark:text-white">{children}</strong>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 dark:bg-[#0a0a0a] text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
        {children}
      </pre>
    ),
  };
}

export const postMarkdownComponents = createContentMarkdownComponents(
  'text-lg leading-relaxed text-ink dark:text-gray-200 mb-4'
);

export const projectMarkdownComponents = createContentMarkdownComponents(
  'text-base leading-relaxed text-ink dark:text-gray-200 mb-4'
);
