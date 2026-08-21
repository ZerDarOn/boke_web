import { ExternalLink, PlayCircle } from 'lucide-react';
import type { MediaHighlight } from '../lib/mediaHighlights';

interface MediaHighlightsProps {
  highlights: MediaHighlight[];
  title: string;
}

const MediaHighlights = ({ highlights, title }: MediaHighlightsProps) => {
  if (highlights.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="mb-4 flex items-center gap-2">
        <PlayCircle size={18} className="text-neon" />
        <h3 className="text-lg font-bold text-ink dark:text-white">精彩片段</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {highlights.map((highlight, index) => (
          <a
            key={`${highlight.url}-${index}`}
            href={highlight.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-neon dark:border-white/10"
            aria-label={`打开 ${title} 的片段：${highlight.title}`}
          >
            {highlight.thumbnail ? (
              <img
                src={highlight.thumbnail}
                alt={`${highlight.title} 的封面`}
                loading="lazy"
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-neon/10 text-neon">
                <PlayCircle size={32} />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-ink dark:text-white">{highlight.title}</h4>
                <ExternalLink size={15} className="mt-0.5 shrink-0 text-neon" />
              </div>
              {highlight.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{highlight.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default MediaHighlights;
