import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';
import { postSchema } from '../schemas';
import { z } from 'zod';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';

const router = Router();

const passwordSchema = z.object({
  password: z.string().min(1),
});

router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'posts' }), PostController.getAll);

router.get('/categories', cacheMiddleware({ ttl: 600, keyPrefix: 'posts' }), PostController.getCategories);

router.get('/tags', cacheMiddleware({ ttl: 600, keyPrefix: 'posts' }), PostController.getTags);

router.get('/tags/popular', cacheMiddleware({ ttl: 600, keyPrefix: 'posts' }), PostController.getPopularTags);

router.get('/:id', optionalAuth, PostController.getById);

router.get('/:id/related', cacheMiddleware({ ttl: 300, keyPrefix: 'post' }), PostController.getRelated);

router.post('/:id/view', PostController.incrementView);

router.post('/:id/like', PostController.incrementLike);

router.post('/:id/verify', validateBody(passwordSchema), PostController.verifyPassword);

router.post('/', authenticate, requireAdmin, validateBody(postSchema), invalidateCache('posts:*'), PostController.create);

router.put('/:id', authenticate, requireAdmin, validateBody(postSchema.partial()), invalidateCache('posts:*'), invalidateCache('post:*'), PostController.update);

router.delete('/:id', authenticate, requireAdmin, invalidateCache('posts:*'), invalidateCache('post:*'), PostController.delete);

export default router;
