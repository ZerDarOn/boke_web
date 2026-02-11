import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ data: [] }));
router.get('/stats', (req, res) => res.json({ total: 0, completed: 0, active: 0 }));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));

export default router;
