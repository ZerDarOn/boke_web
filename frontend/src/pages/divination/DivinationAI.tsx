import { useEffect, useRef, useState } from 'react';
import type { Components } from 'react-markdown';
import { aiApi } from '../../lib/api';
import { useUpdateDivinationReading } from '@/hooks/queries/divination';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface DivinationAIProps {
  kind: 'tarot' | 'iching' | 'astrology';
  spread: string;
  question?: string;
  recordId?: string;
}

interface Followup {
  q: string;
  a: string;
}

const DIVINATION_MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h2 className="mb-3 mt-6 font-serif text-xl font-bold text-[hsl(var(--div-text-hsl))]">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-3 mt-6 font-serif text-lg font-bold text-[hsl(var(--div-text-hsl))]">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-5 font-serif text-base font-bold text-[hsl(var(--div-text-hsl))]">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-2 mt-4 font-mono text-sm font-semibold tracking-wide text-neon">{children}</h5>,
  h5: ({ children }) => <h6 className="mb-2 mt-4 font-serif text-sm font-semibold text-[hsl(var(--div-text-hsl))]">{children}</h6>,
  h6: ({ children }) => <p className="mb-2 mt-4 font-serif text-sm font-semibold text-[hsl(var(--div-text-hsl))]">{children}</p>,
  p: ({ children }) => <p className="mb-3 font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/0.78)] md:text-[15px]">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6 font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/0.76)] md:text-[15px]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6 font-serif text-sm leading-7 text-[hsla(var(--div-text-hsl)/0.76)] md:text-[15px]">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-[hsl(var(--div-text-hsl))]">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-neon/50 pl-4 text-[hsla(var(--div-text-hsl)/0.7)]">{children}</blockquote>,
  hr: () => <hr className="my-5 border-0 border-t border-[hsla(var(--div-line-hsl)/0.15)]" />,
};

function DivinationMarkdown({ content }: { content: string }) {
  return <MarkdownRenderer content={content} components={DIVINATION_MARKDOWN_COMPONENTS} />;
}

const FOLLOWUP_SUGGESTIONS = [
  '这份解读里最值得我先行动的是什么？',
  '如果我选择另一条路，局面会怎样变化？',
  '这份结果提醒我需要避开什么？',
];

export default function DivinationAI({ kind, spread, question, recordId }: DivinationAIProps) {
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const updateReading = useUpdateDivinationReading();
  const savedReadingKey = useRef('');

  useEffect(() => {
    if (!recordId || !reading) return;
    const readingKey = `${recordId}:${reading}`;
    if (savedReadingKey.current === readingKey) return;
    savedReadingKey.current = readingKey;
    updateReading.mutate({ id: recordId, aiReading: reading });
  }, [recordId, reading, updateReading]);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await aiApi.divination({ kind, spread, question });
      if (res.success && res.data) {
        setReading(res.data.reading);
      } else {
        setError('AI 深度解读暂时不可用，请稍后再试');
      }
    } catch {
      setError('AI 深度解读暂时不可用，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const ask = async () => {
    const q = input.trim();
    if (!q || asking) return;
    setAsking(true);
    setError('');
    const latest = [
      reading,
      ...followups.map(f => `追问：${f.q}\n回答：${f.a}`),
    ].filter(Boolean).join('\n\n').slice(-5800);
    try {
      const res = await aiApi.divination({
        kind,
        spread,
        question,
        followup: q,
        previous_reading: latest,
      });
      if (res.success && res.data) {
        const answer = res.data.reading;
        setFollowups(fs => [...fs, { q, a: answer }]);
        setInput('');
      } else {
        setError('追问失败，请稍后再试');
      }
    } catch {
      setError('追问失败，请稍后再试');
    } finally {
      setAsking(false);
    }
  };

  const hasReading = reading.length > 0;

  return (
    <div className="mt-10">
      {/* AI 深度解读入口 */}
      <div className="border border-neon/20 rounded-2xl p-6 md:p-8 bg-neon/[0.03] shadow-[0_18px_60px_hsl(var(--color-neon-hsl)/0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-2">
              / AI ORACLE
            </div>
            <p className="font-serif text-[hsla(var(--div-text-hsl)/0.5)] text-xs leading-relaxed max-w-md">
              {hasReading
                ? '已为你生成专属解读，还可以就解读内容继续追问。'
                : '让 AI 结合牌面/卦象/星象，为你写一段专属的深度解读。'}
            </p>
          </div>
          {!hasReading && (
            <button
              onClick={generate}
              disabled={loading}
              aria-label="开始 AI 深度解读"
              className="shrink-0 cursor-pointer font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--div-text-hsl))] border border-neon/40 hover:border-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 bg-neon/10 hover:bg-neon/20 rounded-lg px-5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⋯ 推演中' : '✦ 开始深度解读'}
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 font-mono text-[10px] text-neon/70 animate-pulse">
            ⟡ AI 正在推演，请稍候…
          </div>
        )}

        {error && (
          <div className="mt-4 font-mono text-[10px] tracking-widest text-[hsl(var(--color-secondary-hsl))]">
            {error}
          </div>
        )}

        {hasReading && (
            <div className="mt-5 pt-5 border-t border-[hsla(var(--div-line-hsl)/0.1)]">
            <div className="font-mono text-[9px] uppercase tracking-widest text-neon/60 mb-3">
              ⟡ 深度解读
            </div>
            <div className="font-serif">
              <DivinationMarkdown content={reading} />
            </div>

            {/* 追问区 */}
            <div className="mt-6 pt-5 border-t border-[hsla(var(--div-line-hsl)/0.1)]">
              {followups.length > 0 && (
                <div className="space-y-4 mb-5">
                  {followups.map((f, i) => (
                    <div key={i} className="space-y-2">
                      <div className="font-serif text-xs text-[hsla(var(--div-text-hsl)/0.85)] border-l-2 border-neon/50 pl-3">
                        {f.q}
                      </div>
                      <div className="pl-3">
                        <DivinationMarkdown content={f.a} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-2" aria-label="推荐追问">
                {FOLLOWUP_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="cursor-pointer rounded-md border border-[hsla(var(--div-line-hsl)/0.14)] px-3 py-1.5 text-left font-serif text-[11px] text-[hsla(var(--div-text-hsl)/0.58)] transition-colors hover:border-neon/50 hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  aria-label="输入占卜追问"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') ask();
                  }}
                  placeholder="还想了解什么？继续追问…"
                  maxLength={1000}
                  className="flex-1 bg-transparent border border-[hsla(var(--div-line-hsl)/0.2)] focus:border-neon/60 rounded-lg px-4 py-2.5 font-serif text-sm text-[hsl(var(--div-text-hsl))] placeholder:text-[hsla(var(--div-text-hsl)/0.25)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neon/30"
                />
                <button
                  onClick={ask}
                  disabled={asking || !input.trim()}
                  className="shrink-0 cursor-pointer font-mono text-[10px] uppercase tracking-widest text-neon border border-neon/40 hover:bg-neon/10 rounded-lg px-4 py-2.5 transition-all active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {asking ? '⋯' : '追问'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
