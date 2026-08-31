'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { ItemMatchDetail } from '@/types';

interface ItemGridProps {
  items: ItemMatchDetail[];
}

export default function ItemGrid({ items }: ItemGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
        No item line data extracted yet for this document.
      </div>
    );
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Reconciled Line Items ({items.length})
        </h3>
        <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Price Mismatch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> MRP Mismatch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Unmapped SKU
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">SKU Name</th>
              <th className="py-2.5 px-3">ERP Code</th>
              <th className="py-2.5 px-3">EAN</th>
              <th className="py-2.5 px-3">HSN</th>
              <th className="py-2.5 px-3">UOM</th>
              <th className="py-2.5 px-3 text-right">PO Qty</th>
              <th className="py-2.5 px-3 text-right">Received Qty</th>
              <th className="py-2.5 px-3 text-right">Invoiced Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Unit MRP</th>
              <th className="py-2.5 px-3 text-right">Gross Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const { priceMismatch, mrpMismatch, qtyMismatch } = item.mismatchedCells || {};
              const unmapped = item.unmappedSku;

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  {/* Status Flag */}
                  <td className="py-2.5 px-3">
                    {unmapped ? (
                      <span
                        title="Unmapped Master SKU"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700"
                      >
                        <AlertTriangle className="w-3 h-3 text-slate-600" />
                        Unmapped
                      </span>
                    ) : priceMismatch || mrpMismatch || qtyMismatch ? (
                      <span
                        title={item.itemReasons.join(', ')}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800"
                      >
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Mismatch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 text-emerald-600" />
                        OK
                      </span>
                    )}
                  </td>

                  {/* SKU Name & Mapped Name */}
                  <td className="py-2.5 px-3 max-w-[220px]">
                    <div className="font-medium text-slate-900 truncate" title={item.name}>
                      {item.name}
                    </div>
                    {item.mappedSkuName && item.mappedSkuName !== item.name && (
                      <div className="text-[10px] text-teal-700 truncate" title={`Mapped: ${item.mappedSkuName}`}>
                        Mapped: {item.mappedSkuName}
                      </div>
                    )}
                  </td>

                  {/* ERP Code */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {item.skuErpCode || '-'}
                  </td>

                  {/* EAN */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.eanCode || '-'}
                  </td>

                  {/* HSN */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.hsnCode || '-'}
                  </td>

                  {/* UOM */}
                  <td className="py-2.5 px-3 font-medium text-slate-600">
                    {item.uom || 'PKT'}
                  </td>

                  {/* PO Qty */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-medium ${
                      qtyMismatch ? 'text-amber-700 bg-amber-50/50' : 'text-slate-700'
                    }`}
                  >
                    {item.poQty}
                  </td>

                  {/* Received Qty */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-medium ${
                      qtyMismatch ? 'text-amber-700 bg-amber-50/50' : 'text-slate-700'
                    }`}
                  >
                    {item.grnQty}
                  </td>

                  {/* Invoiced Qty */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-medium ${
                      qtyMismatch ? 'text-amber-700 bg-amber-50/50' : 'text-slate-700'
                    }`}
                  >
                    {item.invoiceQty}
                  </td>

                  {/* Unit Price (Highlighted if Price Mismatch) */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-semibold ${
                      priceMismatch
                        ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-400 rounded-sm'
                        : 'text-slate-800'
                    }`}
                    title={priceMismatch && item.agreedRate ? `Agreed Rate: ₹${item.agreedRate}` : undefined}
                  >
                    {formatCurrency(item.unitPrice)}
                  </td>

                  {/* Unit MRP (Highlighted if MRP Mismatch) */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-semibold ${
                      mrpMismatch
                        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400 rounded-sm'
                        : 'text-slate-700'
                    }`}
                    title={mrpMismatch && item.skuMrp ? `SKU MRP: ₹${item.skuMrp}` : undefined}
                  >
                    {formatCurrency(item.unitMrp)}
                  </td>

                  {/* Gross Amount */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.grossAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
