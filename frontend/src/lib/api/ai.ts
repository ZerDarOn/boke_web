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
  | 'music';

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
};
