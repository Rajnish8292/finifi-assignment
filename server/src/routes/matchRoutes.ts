import { Router, Request, Response } from 'express';
import { computeThreeWayMatch } from '../services/matchEngine.js';

const router = Router();

router.get('/:poNumber', async (req: Request, res: Response) => {
  try {
    const poNumber = Array.isArray(req.params.poNumber) ? req.params.poNumber[0] : req.params.poNumber;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    // Always recomputes from current stored documents
    const matchResult = await computeThreeWayMatch(String(poNumber));
    return res.json(matchResult);
  } catch (error: any) {
    console.error('Error computing three-way match:', error);
    return res.status(500).json({ error: error.message || 'Failed to compute match' });
  }
});

export default router;
