import { Router, Request, Response } from 'express';
import { SkuMaster } from '../models/SkuMaster.js';

const router = Router();

// GET list
router.get('/', async (_req: Request, res: Response) => {
  try {
    const skus = await SkuMaster.find({}).sort({ createdAt: -1 });
    return res.json(skus);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET single
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU Master not found' });
    return res.json(sku);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST create
router.post('/', async (req: Request, res: Response) => {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;

    if (!skuErpCode || !name || agreedRate === undefined) {
      return res.status(400).json({ error: 'skuErpCode, name, and agreedRate are required' });
    }

    const existing = await SkuMaster.findOne({ skuErpCode: skuErpCode.trim() });
    if (existing) {
      return res.status(400).json({ error: `SKU with code ${skuErpCode} already exists` });
    }

    const sku = new SkuMaster({
      skuErpCode: skuErpCode.trim(),
      name,
      eanCode: eanCode ? eanCode.trim() : '',
      hsnCode: hsnCode || '',
      uom: uom || 'PKT',
      agreedRate: Number(agreedRate),
      mrp: mrp ? Number(mrp) : 0,
      priceTolerance: priceTolerance !== undefined ? Number(priceTolerance) : 0.05,
    });

    await sku.save();
    return res.status(201).json(sku);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH update
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.skuErpCode) {
      updateData.skuErpCode = updateData.skuErpCode.trim();
    }
    if (updateData.eanCode) {
      updateData.eanCode = updateData.eanCode.trim();
    }

    const sku = await SkuMaster.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!sku) return res.status(404).json({ error: 'SKU Master not found' });
    return res.json(sku);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sku = await SkuMaster.findByIdAndDelete(id);
    if (!sku) return res.status(404).json({ error: 'SKU Master not found' });
    return res.json({ message: 'SKU Master deleted successfully', id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
