import { useState, type ReactNode } from 'react';
import { aiApi } from '../../lib/api';

interface DivinationAIProps {
  kind: 'tarot' | 'iching' | 'astrology';
  spread: string;
  question?: string;
}

interface Followup {
  q: string;
  a: string;
}

/** 渲染 AI 返回的轻量 Markdown（### 标题 / 加粗 / 列表 / 分隔线 / 换行）。 */
function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let list: ReactNode[] = [];

  const flushList = (key: number) => {
    if (list.length > 0) {
      nodes.push(
        <ul key={key} className="list-disc pl-5 space-y-1.5 my-2">
          {list}
        </ul>
      );
      list = [];
    }
  };

  const inline = (raw: string, key: number): ReactNode => {
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? (
        <strong key={`${key}-${i}`} className="font-bold text-[hsl(var(--div-text-hsl))]">
          {p.slice(2, -2)}
        </strong>
      ) : (
        p
      )
    );
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList(idx);
      return;
    }
    if (/^---+\s*$/.test(line.trim())) {
      flushList(idx);
      nodes.push(
        <div key={idx} className="my-3 h-px bg-[hsla(var(--div-line-hsl)/0.15)]" />
      );
      return;
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      list.push(
        <li key={idx} className="text-xs leading-relaxed">
          {inline(line.trim().slice(2), idx)}
        </li>
      );
      return;
    }
    flushList(idx);
    if (line.trim().startsWith('### ')) {
      nodes.push(
        <div key={idx} className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon mt-4 mb-2">
          {line.trim().slice(4)}
        </div>
      );
    } else if (line.trim().startsWith('## ')) {
      nodes.push(
        <div key={idx} className="font-serif text-sm font-bold text-[hsl(var(--div-text-hsl))] mt-4 mb-2">
          {inline(line.trim().slice(3), idx)}
        </div>
      );
    } else {
      nodes.push(
        <p key={idx} className="text-xs leading-relaxed text-[hsla(var(--div-text-hsl)/0.7)] mb-2">
          {inline(line, idx)}
        </p>
      );
    }
  });
  flushList(lines.length + 1);
  return nodes;
}

export default function DivinationAI({ kind, spread, question }: DivinationAIProps) {
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);

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
    const latest = reading || followups[followups.length - 1]?.a || '';
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
      <div className="border border-neon/20 rounded-2xl p-6 bg-neon/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-2">
              ✦ AI 深度解读
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
              className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--div-text-hsl))] border border-neon/40 hover:border-neon bg-neon/10 hover:bg-neon/20 rounded-lg px-5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="space-y-1 font-serif whitespace-pre-wrap">
              {renderMarkdown(reading)}
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
                      <div className="font-serif text-xs leading-relaxed text-[hsla(var(--div-text-hsl)/0.65)] whitespace-pre-wrap pl-3">
                        {renderMarkdown(f.a)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') ask();
                  }}
                  placeholder="还想了解什么？继续追问…"
                  maxLength={1000}
                  className="flex-1 bg-transparent border border-[hsla(var(--div-line-hsl)/0.2)] focus:border-neon/60 rounded-lg px-4 py-2.5 font-serif text-sm text-[hsl(var(--div-text-hsl))] placeholder:text-[hsla(var(--div-text-hsl)/0.25)] outline-none transition-colors"
                />
                <button
                  onClick={ask}
                  disabled={asking || !input.trim()}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-neon border border-neon/40 hover:bg-neon/10 rounded-lg px-4 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
