import { Prisma } from '@prisma/client';

/**
 * 统一的公开文章访问策略。
 *
 * 所有面向非管理员的查询（列表、详情、RSS、搜索、相关推荐、分类、标签）
 * 都必须使用此常量作为 WHERE 基础条件，确保：
 * 1. 只返回已发布的文章（排除草稿）
 * 2. 只返回公开访问级别的文章（排除 PRIVATE / PASSWORD）
 *
 * 管理员接口不受此限制。
 */
export const publicPostWhere = {
  isPublished: true,
  accessLevel: 'PUBLIC' as const,
} satisfies Prisma.PostWhereInput;

/**
 * 文章列表访问策略：排除 PRIVATE（PUBLIC 和 PASSWORD 可出现在列表中）。
 * PASSWORD 文章在列表中只展示摘要，详情需要密码验证。
 */
export const listablePostWhere = {
  isPublished: true,
  accessLevel: { not: 'PRIVATE' } as const,
} satisfies Prisma.PostWhereInput;
