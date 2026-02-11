import { Router } from 'express';

const router = Router();

// GET /api/search - 全局搜索
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    // TODO: Implement search across all collections
    res.json({
      posts: [],
      projects: [],
      announcements: [],
      diaries: [],
      anime: [],
      gallery: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
