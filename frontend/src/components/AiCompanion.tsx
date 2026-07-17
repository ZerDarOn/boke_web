import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Send, ShieldCheck, Sparkles, X, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { aiApi, type ChatMessage, type CompanionProfile } from '../lib/api';
import { getCompanionPageContext } from '../lib/companionPageContext';

const FALLBACK_PROFILE: CompanionProfile = {
  version: 1,
  name: '墨璃',
  public_role: 'INK.SPIRIT 档案馆的电子女仆与引路人',
  visitor_address: '客人',
  traits: {},
  greetings: {
    default: '欢迎来到 INK.SPIRIT，客人。想了解文章或项目的话，墨璃可以替你查找公开档案。',
  },
  suggestions: ['带我看看代表文章', '这里有哪些值得看的项目？'],
};

/** 右下角的墨璃入口与公开档案对话面板。 */
const AiCompanion: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<CompanionProfile>(FALLBACK_PROFILE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const modelHostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);
  const pageContext = useMemo(
    () => getCompanionPageContext(location.pathname, document.title),
    [location.pathname]
  );

  useEffect(() => {
    let active = true;
    void aiApi.getCompanionProfile().then((response) => {
      if (active && response.success && response.data) {
        setProfile(response.data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;
    const greeting = profile.greetings[pageContext.page_type] ?? profile.greetings.default;
    setMessages((currentMessages) => currentMessages.length > 0
      ? currentMessages
      : [{ role: 'assistant', content: greeting }]);
  }, [open, pageContext.page_type, profile.greetings]);

  // 扩展点 1：在这里初始化你的 3D / Live2D / VRM 模型
  useEffect(() => {
    const host = modelHostRef.current;
    if (!host) return;
    // 例：const app = new PIXI.Application({ ... }); host.appendChild(app.view as any);
    //     之后 return () => app.destroy();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (message: string) => {
    const text = message.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const history = next.slice(-8).map(({ role, content }) => ({ role, content }));
      const res = await aiApi.chat(text, history, pageContext);
      const reply = res.success && res.data ? res.data.reply : '抱歉，我暂时无法回答（服务未连接）。';
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: reply,
          sources: res.data?.sources,
          grounded: res.data?.grounded,
          confidence: res.data?.confidence,
          refusalReason: res.data?.refusal_reason,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '出错了，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    void sendMessage(input);
  };

  const hasUserMessage = messages.some((message) => message.role === 'user');

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 pb-safe pr-safe">
      {/* 对话面板 */}
      {open && (
        <div id="ai-companion-panel" className="w-[min(88vw,22rem)] h-[min(70vh,28rem)] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-neon" />
              <span className="text-sm font-bold text-white tracking-wide">{profile.name}</span>
              <span
                title={profile.public_role}
                className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 border border-white/10 rounded"
              >
                ARCHIVE MAID
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭 AI 助手"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* 消息列表 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-neon text-white rounded-br-sm'
                      : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                  {m.role === 'assistant' && m.refusalReason && (
                    <div className="mt-2 border-t border-white/10 pt-1.5 text-[10px] font-mono text-gray-500">
                      证据不足，未生成推测性回答
                    </div>
                  )}
                  {m.role === 'assistant' && m.grounded && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-mono text-neon">
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>公开内容已核验 · 最高相关度 {Math.round((m.confidence ?? 0) * 100)}%</span>
                      </div>
                      <div className="space-y-1.5">
                        {m.sources?.map((source) => (
                          <a
                            key={`${source.citation}-${source.url}`}
                            href={source.url}
                            className="block rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 hover:border-neon/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon"
                          >
                            <span className="flex items-center gap-1 text-[11px] text-gray-200">
                              <BookOpen size={11} className="text-neon" aria-hidden="true" />
                              <span className="font-mono text-neon">[{source.citation}]</span>
                              <span className="truncate">{source.title}</span>
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                              {source.excerpt}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!hasUserMessage && !loading && profile.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="快捷问题">
                {profile.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-neon/20 bg-neon/5 px-2.5 py-1 text-[10px] text-gray-400 transition-colors hover:border-neon/50 hover:text-neon focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Loader2 size={16} className="text-neon animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="p-3 border-t border-white/10 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`向${profile.name}询问公开档案…`}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-neon/50 transition-colors"
            />
            <button
              onClick={handleSend}
              aria-label="发送消息"
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-neon text-white flex items-center justify-center hover:bg-neon/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 临时墨印核心；ai-model-host 保留给后续立绘或动态模型。 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={profile.name}
        aria-label={open ? `收起${profile.name}` : `打开${profile.name}`}
        aria-expanded={open}
        aria-controls="ai-companion-panel"
        className="companion-orb-trigger group relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full transition-transform duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent motion-reduce:transform-none md:h-24 md:w-24"
      >
        <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap border border-neon/20 bg-ink/90 px-3 py-2 text-left opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:-translate-x-1 group-hover:opacity-100 group-focus-visible:-translate-x-1 group-focus-visible:opacity-100 sm:block">
          <span className="block font-serif text-xs font-semibold tracking-[0.18em] text-white">墨璃</span>
          <span className="mt-0.5 block font-mono text-[9px] tracking-[0.12em] text-neon/60">档案馆 · 待命中</span>
        </span>

        <span className="companion-orb-halo" aria-hidden="true" />
        <div
          ref={modelHostRef}
          id="ai-model-host"
          className={`companion-orb-shell ${open ? 'companion-orb-shell--open' : ''}`}
        >
          <span className="companion-orb-ambient" aria-hidden="true" />
          <svg
            viewBox="0 0 96 96"
            className="companion-orb-glyph"
            aria-hidden="true"
          >
            <circle className="companion-orb-track" cx="48" cy="48" r="32" />
            <circle className="companion-orb-orbit" cx="48" cy="48" r="37" />
            <path className="companion-orb-seal" d="M48 24 67 43 48 72 29 43Z" />
            <path className="companion-orb-ink" d="M48 33c2 9 10 12 10 21 0 7-4 12-10 12s-10-5-10-12c0-9 8-12 10-21Z" />
            <circle className="companion-orb-core" cx="48" cy="52" r="4" />
          </svg>
          <span className="companion-orb-name">墨璃</span>
        </div>
        <span className="companion-orb-status" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AiCompanion;
