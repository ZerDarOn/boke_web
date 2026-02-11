import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => res.json({ data: [] }));
router.get('/current', (req, res) => res.json({ status: 'Coding...' }));

export default router;
