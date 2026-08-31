import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Grn } from '../models/Grn.js';
import { Invoice } from '../models/Invoice.js';
import { computeThreeWayMatch } from './matchEngine.js';

export interface SummaryData {
  poNumber: string;
  statCards: {
    poAmount: number;
    totalInvoiced: number;
    totalReceived: number;
  };
  associatedDocs: Array<{
    documentType: 'PO' | 'GRN' | 'Invoice';
    documentNumber: string;
    date: Date | string;
    quantity: number;
    cumulativeInvoiced: number;
    cumulativeReceived: number;
    pendingDelivery: number;
  }>;
  currentStatusRow: {
    cumulativeInvoiced: number;
    cumulativeReceived: number;
    pendingDelivery: number;
    status: string;
  };
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getPOSummary(poNumber: string): Promise<SummaryData> {
  const cleanPoNumber = String(poNumber || '').trim();
  const escapedPo = escapeRegExp(cleanPoNumber);
  const poRegex = { $regex: new RegExp(`^${escapedPo}$`, 'i') };

  const pos = await PurchaseOrder.find({ poNumber: poRegex }).lean();
  const grns = await Grn.find({ poNumber: poRegex }).lean();
  const invoices = await Invoice.find({ poNumber: poRegex }).lean();

  const match = await computeThreeWayMatch(poNumber);

  let poAmount = 0;
  let poTotalQty = 0;
  pos.forEach((po: any) => {
    po.items.forEach((it: any) => {
      const q = Number(it.quantity) || 0;
      poTotalQty += q;
      poAmount += q * (Number(it.unitRate) || 0);
    });
  });

  let totalInvoiced = 0;
  let totalInvoicedQty = 0;
  invoices.forEach((inv: any) => {
    inv.items.forEach((it: any) => {
      const q = Number(it.quantity) || 0;
      totalInvoicedQty += q;
      totalInvoiced += q * (Number(it.unitRate) || 0);
    });
  });

  let totalReceived = 0;
  let totalReceivedQty = 0;
  grns.forEach((grn: any) => {
    grn.items.forEach((it: any) => {
      const q = Number(it.receivedQuantity) || 0;
      totalReceivedQty += q;
      const rate = Number(it.unitRate) || Number(it.mrp) || 0;
      totalReceived += q * rate;
    });
  });

  const associatedDocs: SummaryData['associatedDocs'] = [];

  let cumInvoiced = 0;
  let cumReceived = 0;

  // Add Original PO Row
  pos.forEach((p: any) => {
    const qty = p.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0);
    associatedDocs.push({
      documentType: 'PO',
      documentNumber: p.poNumber,
      date: p.poDate,
      quantity: qty,
      cumulativeInvoiced: 0,
      cumulativeReceived: 0,
      pendingDelivery: Math.max(0, qty - cumReceived),
    });
  });

  // Add Invoice Rows
  invoices.forEach((inv: any) => {
    const qty = inv.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0);
    cumInvoiced += qty;
    associatedDocs.push({
      documentType: 'Invoice',
      documentNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      quantity: qty,
      cumulativeInvoiced: cumInvoiced,
      cumulativeReceived: cumReceived,
      pendingDelivery: Math.max(0, poTotalQty - cumReceived),
    });
  });

  // Add GRN Rows
  grns.forEach((grn: any) => {
    const qty = grn.items.reduce((acc: number, it: any) => acc + (Number(it.receivedQuantity) || 0), 0);
    cumReceived += qty;
    associatedDocs.push({
      documentType: 'GRN',
      documentNumber: grn.grnNumber,
      date: grn.grnDate,
      quantity: qty,
      cumulativeInvoiced: cumInvoiced,
      cumulativeReceived: cumReceived,
      pendingDelivery: Math.max(0, poTotalQty - cumReceived),
    });
  });

  const pendingDelivery = Math.max(0, poTotalQty - cumReceived);

  return {
    poNumber: cleanPoNumber,
    statCards: {
      poAmount,
      totalInvoiced,
      totalReceived,
    },
    associatedDocs,
    currentStatusRow: {
      cumulativeInvoiced: cumInvoiced,
      cumulativeReceived: cumReceived,
      pendingDelivery,
      status: match.status,
    },
  };
}
