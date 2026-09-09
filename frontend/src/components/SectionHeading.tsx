import type { ReactNode } from 'react';

export interface SectionHeadingProps {
  action?: ReactNode;
  description?: string;
  eyebrow: string;
  index: string;
  inverted?: boolean;
  level?: 'h1' | 'h2';
  title: string;
}

const SectionHeading = ({
  action,
  description,
  eyebrow,
  index,
  inverted = false,
  level = 'h2',
  title,
}: SectionHeadingProps) => {
  const HeadingTag = level;
  const titleColor = inverted ? 'text-white' : 'text-ink dark:text-white';
  const bodyColor = inverted ? 'text-stone-400' : 'text-stone-600 dark:text-stone-400';
  const borderColor = inverted ? 'border-white/15' : 'border-ink/15 dark:border-white/15';

  return (
    <header className={`grid gap-6 border-t pt-5 md:grid-cols-[5rem_minmax(0,1fr)_auto] md:items-start md:gap-8 ${borderColor}`}>
      <span
        aria-hidden="true"
        className="font-mono text-xs font-semibold tracking-[0.28em] text-neon-dark dark:text-neon"
      >
        {index}
      </span>

      <div className="max-w-3xl">
        <p className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-neon-dark dark:text-neon">
          {eyebrow}
        </p>
        <HeadingTag className={`font-serif text-4xl font-black leading-[0.95] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl ${titleColor}`}>
          {title}
        </HeadingTag>
        {description && (
          <p className={`mt-5 max-w-[62ch] font-serif text-base leading-7 text-pretty ${bodyColor}`}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="md:pt-7">{action}</div>}
    </header>
  );
};

export default SectionHeading;
