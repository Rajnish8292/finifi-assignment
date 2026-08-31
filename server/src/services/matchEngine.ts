import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Grn } from '../models/Grn.js';
import { Invoice } from '../models/Invoice.js';
import { SkuMaster } from '../models/SkuMaster.js';

export interface ItemMatchDetail {
  itemKey: string;
  skuMasterId?: string | null;
  skuErpCode?: string;
  name: string;
  mappedSkuName?: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  unitPrice: number; // PO or Invoice rate
  agreedRate?: number;
  unitMrp: number; // PO/Invoice MRP
  skuMrp?: number;
  grossAmount: number; // invoiceQty * unitPrice or poQty * unitPrice
  unmappedSku: boolean;
  itemReasons: string[];
  mismatchedCells: {
    priceMismatch: boolean;
    mrpMismatch: boolean;
    qtyMismatch: boolean;
  };
}

export interface MatchResult {
  poNumber: string;
  status: 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched';
  overallReasons: string[];
  documentsFound: {
    hasPO: boolean;
    poCount: number;
    grnCount: number;
    invoiceCount: number;
  };
  itemMatches: ItemMatchDetail[];
  linkedDocs: {
    pos: Array<{ _id: string; poNumber: string; poDate: Date; vendorName: string }>;
    grns: Array<{ _id: string; grnNumber: string; grnDate: Date }>;
    invoices: Array<{ _id: string; invoiceNumber: string; invoiceDate: Date }>;
  };
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function computeThreeWayMatch(poNumber: string): Promise<MatchResult> {
  const cleanPoNumber = String(poNumber || '').trim();
  const escapedPo = escapeRegExp(cleanPoNumber);
  const poRegex = { $regex: new RegExp(`^${escapedPo}$`, 'i') };

  const pos = await PurchaseOrder.find({ poNumber: poRegex }).lean();
  const grns = await Grn.find({ poNumber: poRegex }).lean();
  const invoices = await Invoice.find({ poNumber: poRegex }).lean();

  const hasPO = pos.length > 0;
  const poCount = pos.length;
  const grnCount = grns.length;
  const invoiceCount = invoices.length;

  const overallReasonsSet = new Set<string>();

  // Rule: duplicate_po
  if (poCount > 1) {
    overallReasonsSet.add('duplicate_po');
  }

  // Rule: duplicate_document (for GRNs and Invoices)
  const grnNumbers = grns.map((g: any) => g.grnNumber);
  const invNumbers = invoices.map((i: any) => i.invoiceNumber);
  if (new Set(grnNumbers).size < grnNumbers.length || new Set(invNumbers).size < invNumbers.length) {
    overallReasonsSet.add('duplicate_document');
  }

  // Rule: invoice_date_after_po_date
  if (hasPO) {
    const mainPoDate = new Date(pos[0].poDate).getTime();
    for (const inv of invoices) {
      if (new Date(inv.invoiceDate).getTime() > mainPoDate) {
        overallReasonsSet.add('invoice_date_after_po_date');
        break;
      }
    }
  }

  // Collect all unique item keys across POs, GRNs, Invoices
  const allMasterIds = new Set<string>();
  pos.forEach((p: any) => p.items.forEach((it: any) => it.skuMaster && allMasterIds.add(it.skuMaster.toString())));
  grns.forEach((g: any) => g.items.forEach((it: any) => it.skuMaster && allMasterIds.add(it.skuMaster.toString())));
  invoices.forEach((i: any) => i.items.forEach((it: any) => it.skuMaster && allMasterIds.add(it.skuMaster.toString())));

  const masterSkuRecords = await SkuMaster.find({ _id: { $in: Array.from(allMasterIds) } }).lean();
  const masterSkuMap = new Map<string, any>();
  masterSkuRecords.forEach((s: any) => masterSkuMap.set(String(s._id), s));

  // Map of itemKey -> aggregated item data
  const itemMap = new Map<string, {
    key: string;
    skuMasterId: string | null;
    rawItemCode: string;
    description: string;
    poQty: number;
    grnQty: number;
    invoiceQty: number;
    unitPrice: number;
    unitMrp: number;
    poItemPresent: boolean;
  }>();

  function getItemKey(item: any): { key: string; masterId: string | null } {
    if (item.skuMaster) {
      const idStr = item.skuMaster.toString();
      return { key: `master:${idStr}`, masterId: idStr };
    }
    const normalizedCode = (item.itemCode || '').trim().toLowerCase();
    return { key: `raw:${normalizedCode}`, masterId: null };
  }

  // Process PO items
  pos.forEach((po: any) => {
    po.items.forEach((it: any) => {
      const { key, masterId } = getItemKey(it);
      const existing = itemMap.get(key) || {
        key,
        skuMasterId: masterId,
        rawItemCode: it.itemCode,
        description: it.description || '',
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        unitPrice: it.unitRate || 0,
        unitMrp: it.mrp || 0,
        poItemPresent: true,
      };
      existing.poQty += Number(it.quantity) || 0;
      if (it.unitRate) existing.unitPrice = it.unitRate;
      if (it.mrp) existing.unitMrp = it.mrp;
      existing.poItemPresent = true;
      itemMap.set(key, existing);
    });
  });

  // Process GRN items
  grns.forEach((grn: any) => {
    grn.items.forEach((it: any) => {
      const { key, masterId } = getItemKey(it);
      const existing = itemMap.get(key) || {
        key,
        skuMasterId: masterId,
        rawItemCode: it.itemCode,
        description: it.description || '',
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        unitPrice: 0,
        unitMrp: it.mrp || 0,
        poItemPresent: false,
      };
      existing.grnQty += Number(it.receivedQuantity) || 0;
      if (it.mrp) existing.unitMrp = it.mrp;
      itemMap.set(key, existing);
    });
  });

  // Process Invoice items
  invoices.forEach((inv: any) => {
    inv.items.forEach((it: any) => {
      const { key, masterId } = getItemKey(it);
      const existing = itemMap.get(key) || {
        key,
        skuMasterId: masterId,
        rawItemCode: it.itemCode,
        description: it.description || '',
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        unitPrice: it.unitRate || 0,
        unitMrp: it.mrp || 0,
        poItemPresent: false,
      };
      existing.invoiceQty += Number(it.quantity) || 0;
      if (it.unitRate) existing.unitPrice = it.unitRate;
      if (it.mrp) existing.unitMrp = it.mrp;
      itemMap.set(key, existing);
    });
  });

  const itemMatches: ItemMatchDetail[] = [];
  let hasHardViolations = false;
  let hasQuantityMismatch = false;

  for (const entry of itemMap.values()) {
    const skuMaster = entry.skuMasterId ? masterSkuMap.get(entry.skuMasterId) : null;
    const itemReasons: string[] = [];

    const unmappedSku = !skuMaster;
    if (unmappedSku) {
      itemReasons.push('unmapped_master_sku');
      overallReasonsSet.add('unmapped_master_sku');
    }

    // Rule: item_missing_in_po
    if (!entry.poItemPresent && hasPO) {
      itemReasons.push('item_missing_in_po');
      overallReasonsSet.add('item_missing_in_po');
      hasHardViolations = true;
    }

    // Rule: grn_qty_exceeds_po_qty
    if (hasPO && entry.grnQty > entry.poQty) {
      itemReasons.push('grn_qty_exceeds_po_qty');
      overallReasonsSet.add('grn_qty_exceeds_po_qty');
      hasHardViolations = true;
    }

    // Rule: invoice_qty_exceeds_po_qty
    if (hasPO && entry.invoiceQty > entry.poQty) {
      itemReasons.push('invoice_qty_exceeds_po_qty');
      overallReasonsSet.add('invoice_qty_exceeds_po_qty');
      hasHardViolations = true;
    }

    // Rule: invoice_qty_exceeds_grn_qty
    if (grnCount > 0 && entry.invoiceQty > entry.grnQty) {
      itemReasons.push('invoice_qty_exceeds_grn_qty');
      overallReasonsSet.add('invoice_qty_exceeds_grn_qty');
      hasHardViolations = true;
    }

    let priceMismatch = false;
    let mrpMismatch = false;

    // Rule: price_mismatch against SkuMaster agreedRate
    if (skuMaster && skuMaster.agreedRate && entry.unitPrice > 0) {
      const tolerance = skuMaster.priceTolerance || 0.05;
      const diff = Math.abs(entry.unitPrice - skuMaster.agreedRate) / skuMaster.agreedRate;
      if (diff > tolerance) {
        priceMismatch = true;
        itemReasons.push('price_mismatch');
        overallReasonsSet.add('price_mismatch');
      }
    }

    // Rule: mrp_mismatch against SkuMaster mrp
    if (skuMaster && skuMaster.mrp && entry.unitMrp > 0) {
      const diff = Math.abs(entry.unitMrp - skuMaster.mrp) / skuMaster.mrp;
      if (diff > 0.01) {
        mrpMismatch = true;
        itemReasons.push('mrp_mismatch');
        overallReasonsSet.add('mrp_mismatch');
      }
    }

    const qtyMismatch = entry.poQty !== entry.grnQty || entry.poQty !== entry.invoiceQty || entry.grnQty !== entry.invoiceQty;
    if (qtyMismatch) {
      hasQuantityMismatch = true;
    }

    const grossAmount = (entry.invoiceQty > 0 ? entry.invoiceQty : entry.poQty) * (entry.unitPrice || (skuMaster?.agreedRate || 0));

    itemMatches.push({
      itemKey: entry.key,
      skuMasterId: entry.skuMasterId,
      skuErpCode: skuMaster?.skuErpCode || entry.rawItemCode,
      name: entry.description || skuMaster?.name || entry.rawItemCode,
      mappedSkuName: skuMaster?.name || undefined,
      eanCode: skuMaster?.eanCode || undefined,
      hsnCode: skuMaster?.hsnCode || undefined,
      uom: skuMaster?.uom || 'PKT',
      poQty: entry.poQty,
      grnQty: entry.grnQty,
      invoiceQty: entry.invoiceQty,
      unitPrice: entry.unitPrice || (skuMaster?.agreedRate || 0),
      agreedRate: skuMaster?.agreedRate,
      unitMrp: entry.unitMrp || (skuMaster?.mrp || 0),
      skuMrp: skuMaster?.mrp,
      grossAmount,
      unmappedSku,
      itemReasons,
      mismatchedCells: {
        priceMismatch,
        mrpMismatch,
        qtyMismatch,
      },
    });
  }

  const hardViolationCodes = [
    'grn_qty_exceeds_po_qty',
    'invoice_qty_exceeds_grn_qty',
    'invoice_qty_exceeds_po_qty',
    'invoice_date_after_po_date',
    'duplicate_po',
    'duplicate_document',
    'item_missing_in_po',
  ];

  const overallReasons = Array.from(overallReasonsSet);
  const containsHardViolation = overallReasons.some((r) => hardViolationCodes.includes(r));

  let status: 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched' = 'matched';

  if (!hasPO || grnCount === 0 || invoiceCount === 0) {
    status = 'insufficient_documents';
  } else if (containsHardViolation) {
    status = 'mismatch';
  } else if (hasQuantityMismatch || overallReasons.length > 0) {
    status = 'partially_matched';
  } else {
    status = 'matched';
  }

  return {
    poNumber: cleanPoNumber,
    status,
    overallReasons,
    documentsFound: {
      hasPO,
      poCount,
      grnCount,
      invoiceCount,
    },
    itemMatches,
    linkedDocs: {
      pos: pos.map((p: any) => ({ _id: String(p._id), poNumber: p.poNumber, poDate: p.poDate, vendorName: p.vendorName })),
      grns: grns.map((g: any) => ({ _id: String(g._id), grnNumber: g.grnNumber, grnDate: g.grnDate })),
      invoices: invoices.map((i: any) => ({ _id: String(i._id), invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate })),
    },
  };
}
