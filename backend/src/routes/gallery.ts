import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ data: [] }));
router.get('/albums', (req, res) => res.json({ data: [] }));
router.get('/albums/:id', (req, res) => res.json({ id: req.params.id }));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
router.post('/:id/comments', (req, res) => res.json({ success: true }));

export default router;
