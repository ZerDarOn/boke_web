import { Request, Response } from 'express';
import { PostService } from '../services/post.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { createPostAccessToken, verifyPostAccessToken } from '../lib/post-access-token';

export class PostController {
  // GET /api/posts
  static async getAll(req: Request, res: Response) {
    try {
      const pagination = getPagination(
        req.query.page as string,
        req.query.limit as string
      );

      const { posts, total } = await PostService.findMany({
        pagination,
        category: req.query.category as string,
        tag: req.query.tag as string,
        search: req.query.search as string,
      });

      response.success(res, posts, undefined, createMeta(total, pagination));
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch posts');
    }
  }

  // GET /api/posts/:id - 支持 ID 或 slug 查询
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // 先尝试用 ID 查询
      let post = await PostService.findById(id);

      // 如果找不到，尝试用 slug 查询
      if (!post) {
        post = await PostService.findBySlug(id);
      }

      if (!post) {
        return response.notFound(res, 'Post not found');
      }

      // 检查访问权限
      const isAdmin = req.user?.role === 'ADMIN';

      // 草稿（未发布）只有管理员可访问
      if (!post.isPublished && !isAdmin) {
        return response.notFound(res, 'Post not found');
      }

      if (post.accessLevel === 'PRIVATE' && !isAdmin) {
        return response.forbidden(res, 'This post is private');
      }

      // 如果是密码保护的文章，检查是否已验证
      if (post.accessLevel === 'PASSWORD') {
        const accessToken = req.headers['x-post-access-token'];
        const verified = isAdmin || verifyPostAccessToken(
          typeof accessToken === 'string' ? accessToken : undefined,
          post.id
        );
        if (!verified) {
          // 返回部分信息，不包含内容
          return response.success(res, {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            date: post.date,
            category: post.category,
            tags: post.tags,
            accessLevel: post.accessLevel,
            needPassword: true,
          });
        }
      }

      const { password, ...safePost } = post;
      void password;
      response.success(res, safePost);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch post');
    }
  }

  // POST /api/posts/:id/verify - 验证文章密码
  static async verifyPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const isValid = await PostService.verifyPassword(id, password);

      if (isValid) {
        return response.success(res, {
          success: true,
          accessToken: createPostAccessToken(id),
        });
      } else {
        response.unauthorized(res, 'Invalid password');
      }
    } catch (error: any) {
      response.error(res, error.message || 'Failed to verify password');
    }
  }

  // GET /api/posts/nav/list
  static async getNavList(_req: Request, res: Response) {
    try {
      const navList = await PostService.getNavList();
      response.success(res, navList);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch post nav list');
    }
  }

  // GET /api/posts/:id/related
  static async getRelated(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const related = await PostService.findRelated(id);
      response.success(res, related);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch related posts');
    }
  }

  // POST /api/posts/:id/view
  static async incrementView(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PostService.incrementView(id);
      response.success(res, { success: true });
    } catch (error: any) {
      if (response.isPrismaNotFound(error)) {
        return response.notFound(res, 'Post not found');
      }
      response.error(res, error.message || 'Failed to increment view');
    }
  }

  // POST /api/posts/:id/like
  static async incrementLike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PostService.incrementLike(id);
      response.success(res, { success: true });
    } catch (error: any) {
      if (response.isPrismaNotFound(error)) {
        return response.notFound(res, 'Post not found');
      }
      response.error(res, error.message || 'Failed to like post');
    }
  }

  // POST /api/posts (Admin)
  static async create(req: Request, res: Response) {
    try {
      const post = await PostService.create(req.body);
      response.created(res, post);
    } catch (error: any) {
      response.badRequest(res, error.message);
    }
  }

  // PUT /api/posts/:id (Admin)
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await PostService.update(id, req.body);
      response.success(res, post, 'Post updated successfully');
    } catch (error: any) {
      if (response.isPrismaNotFound(error)) {
        return response.notFound(res, 'Post not found');
      }
      response.badRequest(res, error.message);
    }
  }

  // DELETE /api/posts/:id (Admin)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PostService.delete(id);
      response.noContent(res);
    } catch (error: any) {
      if (response.isPrismaNotFound(error)) {
        return response.notFound(res, 'Post not found');
      }
      response.error(res, error.message || 'Failed to delete post');
    }
  }

  // GET /api/posts/categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await PostService.getCategories();
      response.success(res, categories);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch categories');
    }
  }

  // GET /api/posts/tags
  static async getTags(req: Request, res: Response) {
    try {
      const tags = await PostService.getAllTags();
      response.success(res, tags);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch tags');
    }
  }

  // GET /api/posts/tags/popular
  static async getPopularTags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tags = await PostService.getPopularTags(limit);
      response.success(res, tags);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch popular tags');
    }
  }
}
