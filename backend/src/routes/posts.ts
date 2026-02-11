import { Router } from 'express';
import { PostController } from '../controllers/post.controller';

const router = Router();

// GET /api/posts - 文章列表
router.get('/', PostController.getAll);

// GET /api/posts/categories - 分类列表
router.get('/categories', PostController.getCategories);

// GET /api/posts/tags - 标签列表
router.get('/tags', PostController.getTags);

// GET /api/posts/tags/popular - 热门标签
router.get('/tags/popular', PostController.getPopularTags);

// GET /api/posts/:id - 文章详情
router.get('/:id', PostController.getById);

// GET /api/posts/:id/related - 相关文章
router.get('/:id/related', PostController.getRelated);

// POST /api/posts/:id/view - 增加阅读量
router.post('/:id/view', PostController.incrementView);

// POST /api/posts/:id/like - 点赞
router.post('/:id/like', PostController.incrementLike);

// POST /api/posts - 创建文章 (Admin)
router.post('/', PostController.create);

// PUT /api/posts/:id - 更新文章 (Admin)
router.put('/:id', PostController.update);

// DELETE /api/posts/:id - 删除文章 (Admin)
router.delete('/:id', PostController.delete);

export default router;
