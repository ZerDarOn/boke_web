import { apiRequest } from './request';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatReply {
  reply: string;
  sources?: { title: string; url: string }[];
}

export const aiApi = {
  /** 与博客 AI 助手对话。后端 /api/ai/chat 未接入知识库时返回占位回复。 */
  chat: async (message: string, history: ChatMessage[] = []) =>
    apiRequest<ChatReply>('/api/ai/chat', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ message, history }),
    }),
};
