import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseDocumentWithGemini } from '../services/geminiService.js';
import { resolveDocumentItems } from '../services/masterResolutionService.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Grn } from '../models/Grn.js';
import { Invoice } from '../models/Invoice.js';
import { MatchAudit } from '../models/MatchAudit.js';
import { computeThreeWayMatch } from '../services/matchEngine.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const router = Router();

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    let rawDocType = String(req.body.documentType || '').toLowerCase().trim();

    // Map alternative names to standard types
    if (rawDocType === 'fulfillment') rawDocType = 'invoice';
    if (rawDocType === 'delivery') rawDocType = 'grn';

    const documentType = rawDocType as 'po' | 'grn' | 'invoice';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!documentType || !['po', 'grn', 'invoice'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid documentType. Must be po, grn, or invoice' });
    }

    // 1. Extraction with Gemini (or fallback)
    const extracted = await parseDocumentWithGemini(file.path, file.mimetype, documentType);

    // 2. Master Resolution
    const resolvedItems = await resolveDocumentItems(extracted.items);

    let docRecord: any = null;
    let poNumber = String(extracted.header.poNumber || 'CI4PO05788').trim();
    let isDuplicate = false;

    // 3. Persistence & Duplication Check
    if (documentType === 'po') {
      const poRegex = new RegExp(`^${escapeRegExp(poNumber)}$`, 'i');
      const existingPO = await PurchaseOrder.findOne({ poNumber: poRegex });
      if (existingPO) {
        isDuplicate = true;
      }
      docRecord = new PurchaseOrder({
        poNumber,
        poDate: new Date(extracted.header.poDate || Date.now()),
        vendorName: extracted.header.vendorName || 'M/s AFP',
        items: resolvedItems,
        rawParsed: extracted.rawParsed,
        filePath: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
      });
      await docRecord.save();
    } else if (documentType === 'grn') {
      const grnNumber = String(extracted.header.grnNumber || 'GRN-001').trim();
      const poRegex = new RegExp(`^${escapeRegExp(poNumber)}$`, 'i');
      const grnRegex = new RegExp(`^${escapeRegExp(grnNumber)}$`, 'i');
      const existingGRN = await Grn.findOne({
        poNumber: poRegex,
        grnNumber: grnRegex,
      });
      if (existingGRN) {
        isDuplicate = true;
      }
      docRecord = new Grn({
        grnNumber,
        poNumber,
        grnDate: new Date(extracted.header.grnDate || Date.now()),
        items: resolvedItems,
        rawParsed: extracted.rawParsed,
        filePath: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
      });
      await docRecord.save();
    } else if (documentType === 'invoice') {
      const invoiceNumber = String(extracted.header.invoiceNumber || 'INV-001').trim();
      const poRegex = new RegExp(`^${escapeRegExp(poNumber)}$`, 'i');
      const invRegex = new RegExp(`^${escapeRegExp(invoiceNumber)}$`, 'i');
      const existingInvoice = await Invoice.findOne({
        poNumber: poRegex,
        invoiceNumber: invRegex,
      });
      if (existingInvoice) {
        isDuplicate = true;
      }
      docRecord = new Invoice({
        invoiceNumber,
        poNumber,
        invoiceDate: new Date(extracted.header.invoiceDate || Date.now()),
        items: resolvedItems,
        rawParsed: extracted.rawParsed,
        filePath: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
      });
      await docRecord.save();
    }

    // 4. Audit Log
    const poRegex = new RegExp(`^${escapeRegExp(poNumber)}$`, 'i');
    let auditLog = await MatchAudit.findOne({ poNumber: poRegex });
    if (!auditLog) {
      auditLog = new MatchAudit({ poNumber, steps: [] });
    }
    auditLog.steps.push({
      step: `Upload & Process ${documentType.toUpperCase()}`,
      status: isDuplicate ? 'DUPLICATE_FLAGGED' : 'SUCCESS',
      message: `Uploaded ${file.originalname}. Extracted ${resolvedItems.length} items.${isDuplicate ? ' Duplicate detected.' : ''}`,
      at: new Date(),
    });
    await auditLog.save();

    // 5. Recompute Three-Way Match Result
    const matchResult = await computeThreeWayMatch(poNumber);

    return res.status(201).json({
      message: 'Document processed successfully',
      documentType,
      poNumber,
      document: docRecord,
      matchResult,
    });
  } catch (error: any) {
    console.error('Error processing document upload:', error);
    return res.status(500).json({ error: error.message || 'Failed to process document upload' });
  }
});

// GET /documents/po-numbers
router.get('/po-numbers', async (_req: Request, res: Response) => {
  try {
    const pos = await PurchaseOrder.distinct('poNumber');
    const grns = await Grn.distinct('poNumber');
    const invoices = await Invoice.distinct('poNumber');
    const all = Array.from(new Set([...pos, ...grns, ...invoices].map((s) => String(s).trim()))).filter(Boolean);
    return res.json(all);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /documents?type=&poNumber=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, poNumber } = req.query;
    let query: any = {};
    if (poNumber && String(poNumber).trim() !== '') {
      const cleanPo = escapeRegExp(String(poNumber).trim());
      query.poNumber = { $regex: new RegExp(`^${cleanPo}$`, 'i') };
    }

    const reqType = type ? String(type).toLowerCase().trim() : '';

    let results: any[] = [];
    if (!reqType || reqType === 'po') {
      const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 }).lean();
      results.push(...pos.map((p) => ({ ...p, documentType: 'po' })));
    }
    if (!reqType || reqType === 'grn' || reqType === 'delivery') {
      const grns = await Grn.find(query).sort({ createdAt: -1 }).lean();
      results.push(...grns.map((g) => ({ ...g, documentType: 'grn' })));
    }
    if (!reqType || reqType === 'invoice' || reqType === 'fulfillment') {
      const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
      results.push(...invoices.map((i) => ({ ...i, documentType: 'invoice' })));
    }

    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /documents/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let doc: any = await PurchaseOrder.findById(id).lean();
    let type = 'po';
    if (!doc) {
      doc = await Grn.findById(id).lean();
      type = 'grn';
    }
    if (!doc) {
      doc = await Invoice.findById(id).lean();
      type = 'invoice';
    }
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ ...doc, documentType: type });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /documents/:id/file
router.get('/:id/file', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let doc: any = await PurchaseOrder.findById(id).lean();
    if (!doc) doc = await Grn.findById(id).lean();
    if (!doc) doc = await Invoice.findById(id).lean();

    if (!doc || !doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'Original file not found' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename || 'document.pdf'}"`);
    return res.sendFile(path.resolve(doc.filePath));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
