import yaml from 'js-yaml';

/**
 * 内容导入必填字段，与后端 markdown.service.ts 的校验保持一致。
 * 缺少任一字段后端都会拒绝导入。
 */
export const REQUIRED_FRONT_MATTER_FIELDS = ['id', 'title', 'date'] as const;

export interface ParsedFrontMatter {
  /** 解析出的 Front Matter 键值（YAML） */
  data: Record<string, unknown>;
  /** 去掉 Front Matter 后的正文 */
  content: string;
  /** 缺失的必填字段；为空数组表示通过后端校验 */
  missingRequired: string[];
  /** 解析错误（YAML 语法错误 / 缺少 Front Matter），null 表示成功 */
  error: string | null;
}

/**
 * 解析 Markdown 的 Front Matter。
 *
 * 使用 js-yaml（与后端 gray-matter 同一套 YAML 语义），
 * 保证前端预览与后端实际导入"所见即所导"，
 * 避免手写正则解析器漏掉数组换行、嵌套、引号等情况。
 */
export function parseFrontMatter(raw: string): ParsedFrontMatter {
  const match = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/);

  if (!match) {
    return {
      data: {},
      content: raw,
      missingRequired: [...REQUIRED_FRONT_MATTER_FIELDS],
      error: '未找到 Front Matter（缺少 --- 包裹的元数据块）',
    };
  }

  try {
    const loaded = yaml.load(match[1]);
    const data =
      loaded && typeof loaded === 'object' && !Array.isArray(loaded)
        ? (loaded as Record<string, unknown>)
        : {};
    const content = raw.slice(match[0].length);
    const missingRequired = REQUIRED_FRONT_MATTER_FIELDS.filter((key) => {
      const value = data[key];
      return value === undefined || value === null || value === '';
    });

    return { data, content, missingRequired, error: null };
  } catch (e) {
    return {
      data: {},
      content: raw,
      missingRequired: [...REQUIRED_FRONT_MATTER_FIELDS],
      error: e instanceof Error ? `YAML 解析失败：${e.message}` : 'YAML 解析失败',
    };
  }
}

/** 将 Front Matter 字段安全转为展示字符串（处理字符串/数字/日期） */
export function frontMatterText(
  data: Record<string, unknown> | null,
  key: string
): string | undefined {
  const value = data?.[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

/** 读取 Front Matter 中的标签数组 */
export function frontMatterTags(data: Record<string, unknown> | null): string[] {
  const value = data?.tags;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}
