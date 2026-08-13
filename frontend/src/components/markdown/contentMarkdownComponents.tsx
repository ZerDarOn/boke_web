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
        className="text-3xl md:text-4xl font-serif font-bold text-ink dark:text-white mt-12 mb-5 pb-3 border-b-2 border-neon/30 scroll-mt-24 tracking-tight"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-white mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-white/10 scroll-mt-24 tracking-tight"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={headingId(children)}
        className="text-xl md:text-2xl font-serif font-bold text-ink dark:text-white mt-8 mb-3 scroll-mt-24"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        id={headingId(children)}
        className="text-lg md:text-xl font-serif font-semibold text-ink dark:text-white mt-6 mb-2 scroll-mt-24"
      >
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-base md:text-lg font-semibold text-ink dark:text-white mt-5 mb-2 scroll-mt-24">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-base font-semibold text-gray-600 dark:text-gray-400 mt-4 mb-2 scroll-mt-24 uppercase tracking-wider">
        {children}
      </h6>
    ),
    p: ({ children }) => <p className={paragraphClass}>{children}</p>,
    ul: ({ children }) => (
      <ul className="space-y-2 mb-6 ml-6 list-disc marker:text-neon">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 mb-6 ml-6 list-decimal marker:text-neon marker:font-bold">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-base leading-relaxed text-ink dark:text-gray-200 pl-2">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-neon pl-5 py-3 my-6 bg-gray-50/80 dark:bg-white/5 rounded-r-lg italic text-gray-700 dark:text-gray-300 text-base leading-relaxed">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-neon hover:text-neon/80 underline decoration-neon/30 hover:decoration-neon transition-all font-medium"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-ink dark:text-white">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-600 dark:text-gray-400">{children}</em>
    ),
    del: ({ children }) => (
      <del className="line-through text-gray-400 dark:text-gray-500">{children}</del>
    ),
    hr: () => (
      <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent" />
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 dark:bg-[#0a0a0a] text-gray-100 rounded-lg p-4 overflow-x-auto my-6">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-white/10">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 dark:bg-white/5">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2.5 text-left font-semibold text-ink dark:text-white border-b border-gray-200 dark:border-white/10">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2.5 text-ink dark:text-gray-200 border-b border-gray-100 dark:border-white/5">
        {children}
      </td>
    ),
    img: ({ src, alt }) => (
      <figure className="my-6">
        <img
          src={typeof src === 'string' ? src : undefined}
          alt={alt || ''}
          className="w-full rounded-lg border border-gray-200 dark:border-white/10"
          loading="lazy"
        />
        {alt && (
          <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400 italic">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
  };
}

export const postMarkdownComponents = createContentMarkdownComponents(
  'text-lg leading-[1.8] text-ink dark:text-gray-200 mb-5'
);

export const projectMarkdownComponents = createContentMarkdownComponents(
  'text-base leading-[1.75] text-ink dark:text-gray-200 mb-4'
);
