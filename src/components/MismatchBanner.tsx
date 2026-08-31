'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface MismatchBannerProps {
  status: 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched';
  reasons: string[];
}

const reasonLabels: Record<string, string> = {
  grn_qty_exceeds_po_qty: 'Received Quantity Exceeds PO Quantity',
  invoice_qty_exceeds_grn_qty: 'Invoiced Quantity Exceeds Received Quantity',
  invoice_qty_exceeds_po_qty: 'Invoiced Quantity Exceeds PO Quantity',
  invoice_date_after_po_date: 'Invoice Date Postdates PO Date',
  duplicate_po: 'Duplicate PO Upload Detected',
  duplicate_document: 'Duplicate Document Upload Detected',
  item_missing_in_po: 'Document Line Item Missing from PO',
  price_mismatch: 'Price Mismatch vs Contracted Rate',
  mrp_mismatch: 'MRP Mismatch vs SKU Master',
  unmapped_master_sku: 'Unmapped SKU Master Catalogue Record',
};

export default function MismatchBanner({ status, reasons }: MismatchBannerProps) {
  if (status === 'matched') {
    return (
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 rounded-r-lg flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Fully Matched</span>
          <span className="text-xs font-normal">
            — All PO, GRN, and Invoice quantities & rates are completely reconciled with 0 discrepancies.
          </span>
        </div>
      </div>
    );
  }

  if (status === 'insufficient_documents') {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4 rounded-r-lg flex items-center justify-between">
        <div className="flex items-center space-x-2 text-amber-800">
          <Info className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Pending Documents</span>
          <span className="text-xs font-normal">
            — Full set of PO, GRN, and Invoice documents not yet available for complete 3-way match.
          </span>
        </div>
      </div>
    );
  }

  const isHardMismatch = status === 'mismatch';

  return (
    <div
      className={`border-l-4 p-3 mb-4 rounded-r-lg flex flex-col gap-2 ${
        isHardMismatch
          ? 'bg-rose-50 border-rose-500 text-rose-900'
          : 'bg-orange-50 border-orange-500 text-orange-900'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isHardMismatch ? (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
        )}
        <span className="text-xs font-bold uppercase tracking-wider">
          {isHardMismatch ? 'Hard Mismatch Violation' : 'Partial Match Warning'}
        </span>
      </div>

      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-7">
          {reasons.map((r) => (
            <span
              key={r}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                isHardMismatch ? 'bg-rose-200/80 text-rose-900' : 'bg-orange-200/80 text-orange-900'
              }`}
            >
              {reasonLabels[r] || r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
