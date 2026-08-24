import { apiRequest } from './request';

export type CompanionPageType =
  | 'default'
  | 'home'
  | 'posts'
  | 'post'
  | 'archives'
  | 'announcement'
  | 'projects'
  | 'project'
  | 'skills'
  | 'timeline'
  | 'gallery'
  | 'diary'
  | 'anime'
  | 'games'
  | 'about'
  | 'network'
  | 'dashboard'
  | 'music'
  | 'divination';

export interface CompanionPageContext {
  page_type: CompanionPageType;
  pathname: string;
  title: string;
}

export interface CompanionProfile {
  version: number;
  name: string;
  public_role: string;
  visitor_address: string;
  traits: Record<string, number>;
  greetings: Partial<Record<CompanionPageType, string>> & { default: string };
  suggestions: string[];
}

export interface ChatSource {
  citation: string;
  title: string;
  url: string;
  score: number;
  excerpt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  grounded?: boolean;
  confidence?: number;
  refusalReason?: 'insufficient_evidence' | 'invalid_citations' | 'invalid_model_output' | null;
}

export interface ChatReply {
  reply: string;
  sources?: ChatSource[];
  grounded?: boolean;
  confidence?: number;
  refusal_reason?: 'insufficient_evidence' | 'invalid_citations' | 'invalid_model_output' | null;
}

export interface TasteProfile {
  coverage: Record<'post' | 'anime' | 'game' | 'music' | 'music_curation', number>;
  insights: Array<{ key: string; label: string; values: Array<{ label: string; count: number }> }>;
  notice: string;
}

export const aiApi = {
  /** 与博客 AI 伙伴对话，并提供受限的公开页面上下文。 */
  chat: async (
    message: string,
    history: ChatMessage[] = [],
    context?: CompanionPageContext
  ) =>
    apiRequest<ChatReply>('/api/ai/chat', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ message, history, context }),
    }),

  getCompanionProfile: async () =>
    apiRequest<CompanionProfile>('/api/ai/companion/profile', {
      auth: false,
    }),

  /** 占卜馆 AI 深度解读 / 追问（不经过 RAG，直接 LLM 生成）。 */
  divination: async (payload: {
    kind: 'tarot' | 'iching' | 'astrology';
    spread: string;
    question?: string;
    followup?: string;
    previous_reading?: string;
  }) =>
    apiRequest<{ reading: string }>('/api/ai/divination', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload),
    }),

  /** 后台：获取 AI 服务配置（密钥脱敏）。 */
  getAiSettings: async () =>
    apiRequest<{
      settings: Array<{
        key: string;
        value: string;
        masked: boolean;
        set: boolean;
      }>;
    }>('/api/ai/settings'),

  /** 后台：更新 AI 服务配置（写入 ai-service/.env）。 */
  updateAiSettings: async (settings: Record<string, string>) =>
    apiRequest<{ saved: boolean; message: string; reloaded?: boolean; rebuildRequired?: boolean }>('/api/ai/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),

  getIndexStatus: async () =>
    apiRequest<{
      collection: string;
      posts: number;
      sources?: Record<string, number>;
      chunks: number;
      last_operation: string | null;
      last_mutation_at: string | null;
      last_error_type: string | null;
    }>('/api/ai/index/status'),

  getTasteProfile: async () =>
    apiRequest<TasteProfile>('/api/ai/taste-profile'),

  getGroundingStatus: async () =>
    apiRequest<{
      scope: string;
      requests: number;
      grounded_answers: number;
      grounded_rate: number;
      provider_errors: number;
      refusals: Record<string, number>;
    }>('/api/ai/grounding/status'),

  reconcileIndex: async () =>
    apiRequest<{ updated: number; unchanged: number; removed: number }>('/api/ai/index/reconcile', {
      method: 'POST',
    }),

  rebuildIndex: async () =>
    apiRequest<{ indexed: number; posts: number; chunks: number }>('/api/ai/index/rebuild', {
      method: 'POST',
    }),
};
