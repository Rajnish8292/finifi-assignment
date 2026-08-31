'use client';

import React from 'react';
import { SummaryData } from '@/types';
import { DollarSign, FileCheck2, PackageCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface SummaryTabProps {
  summaryData: SummaryData | null;
  loading: boolean;
}

export default function SummaryTab({ summaryData, loading }: SummaryTabProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Loading summary metrics and document breakdown...
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No summary data available. Please select or upload documents for a Purchase Order.
      </div>
    );
  }

  const { statCards, associatedDocs, currentStatusRow } = summaryData;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  return (
    <div className="p-6 space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: PO Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PO Amount</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(statCards.poAmount)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Invoiced */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(statCards.totalInvoiced)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Received */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Received</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(statCards.totalReceived)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Associated Invoice & GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Associated Invoice & GRN Cumulative Reconciliation
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Document No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Cumulative Invoiced</th>
                <th className="py-3 px-4 text-right">Cumulative Received</th>
                <th className="py-3 px-4 text-right">Pending Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {associatedDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.documentType === 'PO'
                          ? 'bg-teal-100 text-teal-800'
                          : doc.documentType === 'Invoice'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">{doc.documentNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {new Date(doc.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">{doc.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{doc.cumulativeInvoiced}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{doc.cumulativeReceived}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                    {doc.pendingDelivery}
                  </td>
                </tr>
              ))}

              {/* Final Current Status Row */}
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td className="py-3.5 px-4" colSpan={3}>
                  <div className="flex items-center space-x-2">
                    <span>CURRENT RECONCILIATION STATUS</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider ${
                        currentStatusRow.status === 'matched'
                          ? 'bg-emerald-500 text-white'
                          : currentStatusRow.status === 'mismatch'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {currentStatusRow.status}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-mono">
                  Cumulative
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-blue-300">
                  {currentStatusRow.cumulativeInvoiced}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                  {currentStatusRow.cumulativeReceived}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                  {currentStatusRow.pendingDelivery}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
