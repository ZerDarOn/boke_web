import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ data: [] }));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
router.put('/:id/progress', (req, res) => res.json({ success: true }));
router.post('/:id/score', (req, res) => res.json({ success: true }));

export default router;
