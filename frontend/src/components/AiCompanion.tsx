import React, { useEffect, useRef, useState } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { aiApi, type ChatMessage } from '../lib/api/ai';

/**
 * 右下角 AI 伙伴浮窗。
 *
 * ┌─ 扩展点 1：3D / 伪3D 模型 ───────────────────────────────────┐
 * │ 下面 id="ai-model-host" 的容器就是模型挂载位。把你找到的资源    │
 * │ 接进去即可（任选其一）：                                        │
 * │  • Live2D：用 pixi-live2d-display 在该容器创建 canvas          │
 * │  • VRM：用 three.js + @pixiv/three-vrm                         │
 * │  • Spline：<spline-viewer url="...">                          │
 * │  • glb/gltf：<model-viewer src="...">（引入 google model-viewer）│
 * │ 用 modelHostRef.current 拿到容器，在 useEffect 里初始化即可。   │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 扩展点 2：知识库 —— 对话走 aiApi.chat → 后端 /api/ai/chat → ai-service。
 * 在 ai-service 接 LLM + 博客内容向量库(RAG) 后，助手即可真正回答。
 */
const AiCompanion: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '嗨，我是这个博客的 AI 助手 ✨ 想了解文章、项目还是站长本人？问我吧。',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const modelHostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat(text, next.slice(-8));
      const reply = res.success && res.data ? res.data.reply : '抱歉，我暂时无法回答（服务未连接）。';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '出错了，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      {/* 对话面板 */}
      {open && (
        <div className="w-[min(88vw,22rem)] h-[min(70vh,28rem)] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-neon" />
              <span className="text-sm font-bold text-white tracking-wide">AI 助手</span>
              <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 border border-white/10 rounded">BETA</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
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
                </div>
              </div>
            ))}
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
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="问点什么…"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-neon/50 transition-colors"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-neon text-white flex items-center justify-center hover:bg-neon/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 伙伴本体 / 3D 模型插槽（点击开关对话） */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="AI 助手"
        className="group relative w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center"
      >
        {/* === 3D 模型挂载位：把模型渲染进这个容器 === */}
        <div
          ref={modelHostRef}
          id="ai-model-host"
          className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center
                     bg-gradient-to-br from-[#101418] to-[#05070a] border border-neon/30
                     shadow-[0_0_24px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_36px_rgba(16,185,129,0.45)]
                     transition-shadow duration-300"
        >
          {/* 占位视觉：模型接入后可删除 */}
          <div className="absolute w-12 h-12 md:w-16 md:h-16 rounded-full bg-neon/20 blur-md animate-pulse-slow" />
          <Sparkles size={28} className="text-neon relative z-10 group-hover:scale-110 transition-transform" />
          <span className="absolute bottom-1.5 text-[8px] md:text-[9px] font-mono text-neon/60 tracking-widest">A.I.</span>
        </div>

        {/* 旋转的霓虹光环 */}
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon/60 border-r-neon/20 animate-spin-slow pointer-events-none" />
      </button>
    </div>
  );
};

export default AiCompanion;
