import { Router, Request, Response } from 'express';
import { getPOSummary } from '../services/summaryService.js';

const router = Router();

router.get('/:poNumber', async (req: Request, res: Response) => {
  try {
    const poNumber = Array.isArray(req.params.poNumber) ? req.params.poNumber[0] : req.params.poNumber;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber is required' });
    }

    const summary = await getPOSummary(String(poNumber));
    return res.json(summary);
  } catch (error: any) {
    console.error('Error fetching PO summary:', error);
    return res.status(500).json({ error: error.message || 'Failed to get summary' });
  }
});

export default router;
