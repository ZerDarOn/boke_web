import { Router } from 'express';

const router = Router();

router.get('/nodes', (req, res) => res.json({ data: [] }));
router.get('/connections', (req, res) => res.json({ data: [] }));

export default router;
