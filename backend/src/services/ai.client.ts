/**
 * AI Service Client
 * Node.js backend calls to Python AI microservice
 */

import axios from 'axios';
import { config } from '../config/env';

const AI_SERVICE_URL = config.AI_SERVICE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 60000; // 60 seconds for AI requests

/**
 * AI Service Types
 */
export interface SummarizeRequest {
  content: string;
  max_length?: number;
}

export interface SummarizeResponse {
  summary: string;
  word_count: number;
  key_points: string[];
}

export interface ExtractKeywordsRequest {
  content: string;
  max_keywords?: number;
}

export interface ExtractKeywordsResponse {
  keywords: Array<{ word: string; score: number }>;
  tags: string[];
}

export interface GenerateTagsRequest {
  title: string;
  content: string;
  max_tags?: number;
}

export interface GenerateTagsResponse {
  tags: string[];
  confidence: number[];
}

export interface SentimentAnalysisRequest {
  content: string;
  language?: string;
}

export interface SentimentAnalysisResponse {
  sentiment: string;
  score: number;
  emotions: { positive: number; negative: number };
}

export interface RecommendPostsRequest {
  user_id?: string;
  post_id: string;
  limit?: number;
}

export interface RecommendPostsResponse {
  posts: any[];
  algorithm: string;
}

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

/**
 * AI Service API Client
 */
class AIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = AI_SERVICE_URL;
  }

  private get internalHeaders(): Record<string, string> {
    return config.AI_INTERNAL_TOKEN
      ? { 'x-ai-internal-token': config.AI_INTERNAL_TOKEN }
      : {};
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return response.data.status === 'healthy' && response.data.capabilities?.generation === true;
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }

  /**
   * Summarize article content
   */
  async summarizeContent(content: string, maxLength = 200): Promise<SummarizeResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/ai/summarize`,
        { content, max_length: maxLength },
        { timeout: REQUEST_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      console.error('Summarization failed:', error.response?.data || error.message);
      throw new Error(`AI summarization failed: ${error.message}`);
    }
  }

  /**
   * Extract keywords from content
   */
  async extractKeywords(content: string, maxKeywords = 10): Promise<ExtractKeywordsResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/ai/extract-keywords`,
        { content, max_keywords: maxKeywords },
        { timeout: REQUEST_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      console.error('Keyword extraction failed:', error.response?.data || error.message);
      throw new Error(`Keyword extraction failed: ${error.message}`);
    }
  }

  /**
   * Generate tags for article
   */
  async generateTags(title: string, content: string, maxTags = 5): Promise<GenerateTagsResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/ai/generate-tags`,
        { title, content, max_tags: maxTags },
        { timeout: REQUEST_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      console.error('Tag generation failed:', error.response?.data || error.message);
      throw new Error(`Tag generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(content: string, language = 'zh'): Promise<SentimentAnalysisResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/ai/sentiment`,
        { content, language },
        { timeout: REQUEST_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      console.error('Sentiment analysis failed:', error.response?.data || error.message);
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Get recommended posts
   */
  async recommendPosts(postId: string, userId?: string, limit = 5): Promise<RecommendPostsResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/recommend/posts`,
        { user_id: userId, post_id: postId, limit },
        { timeout: REQUEST_TIMEOUT }
      );
      return response.data;
    } catch (error: any) {
      console.error('Post recommendation failed:', error.response?.data || error.message);
      throw new Error(`Post recommendation failed: ${error.message}`);
    }
  }

  /**
   * 对话式问答（博客 AI 助手 / 知识库）
   * 代理到 Python AI 微服务的 /api/v1/ai/chat。
   * 扩展点：在 ai-service 里接 LLM + 博客内容向量库(RAG) 即可让助手真正回答。
   */
  async chat(
    message: string,
    history: Array<{ role: string; content: string }> = [],
    context?: CompanionPageContext
  ): Promise<{
    reply: string;
    sources?: Array<{
      citation: string;
      title: string;
      url: string;
      score: number;
      excerpt: string;
    }>;
    grounded?: boolean;
    confidence?: number;
    refusal_reason?: 'insufficient_evidence' | 'invalid_citations' | 'invalid_model_output' | null;
  }> {
    const response = await axios.post(
      `${this.baseURL}/api/v1/ai/chat`,
      { message, history, context },
      { timeout: REQUEST_TIMEOUT }
    );
    return response.data;
  }

  async getCompanionProfile(): Promise<CompanionProfile> {
    const response = await axios.get(
      `${this.baseURL}/api/v1/ai/companion/profile`,
      { timeout: 5000 }
    );
    return response.data;
  }

  async syncPostIndex(postId: string): Promise<any> {
    const response = await axios.put(
      `${this.baseURL}/api/v1/ai/index/posts/${encodeURIComponent(postId)}`,
      undefined,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  async removePostIndex(postId: string): Promise<any> {
    const response = await axios.delete(
      `${this.baseURL}/api/v1/ai/index/posts/${encodeURIComponent(postId)}`,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  async getIndexStatus(): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/api/v1/ai/index/status`,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  async getGroundingStatus(): Promise<any> {
    const response = await axios.get(
      `${this.baseURL}/api/v1/ai/grounding/status`,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  async reconcileIndex(): Promise<any> {
    const response = await axios.post(
      `${this.baseURL}/api/v1/ai/index/reconcile`,
      undefined,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  async rebuildIndex(): Promise<any> {
    const response = await axios.post(
      `${this.baseURL}/api/v1/ai/reindex`,
      undefined,
      { timeout: REQUEST_TIMEOUT, headers: this.internalHeaders }
    );
    return response.data;
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(days = 30): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/analytics/overview`,
        { 
          params: { days },
          timeout: REQUEST_TIMEOUT
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Analytics overview failed:', error.response?.data || error.message);
      throw new Error(`Analytics failed: ${error.message}`);
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(limit = 10): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/analytics/trending`,
        { 
          params: { limit },
          timeout: REQUEST_TIMEOUT
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Trending topics failed:', error.response?.data || error.message);
      throw new Error(`Trending topics failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient();
