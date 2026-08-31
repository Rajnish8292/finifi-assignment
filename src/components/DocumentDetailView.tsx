'use client';

import React, { useState } from 'react';
import MismatchBanner from './MismatchBanner';
import FilePreview from './FilePreview';
import ItemGrid from './ItemGrid';
import { ItemMatchDetail } from '@/types';
import { Calendar, Building, FileText, Hash, UploadCloud, Info } from 'lucide-react';

interface DocumentDetailViewProps {
  documentType: 'po' | 'fulfillment' | 'delivery';
  poNumber: string;
  matchStatus: 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched';
  overallReasons: string[];
  documents: any[];
  itemMatches: ItemMatchDetail[];
  onOpenUpload?: () => void;
}

export default function DocumentDetailView({
  documentType,
  poNumber,
  matchStatus,
  overallReasons,
  documents,
  itemMatches,
  onOpenUpload,
}: DocumentDetailViewProps) {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  const currentDoc = documents && documents.length > 0 ? documents[selectedDocIndex] || documents[0] : null;

  const tabTitle =
    documentType === 'po'
      ? 'Purchase Order (PO)'
      : documentType === 'fulfillment'
      ? 'Tax Invoice (Fulfillment)'
      : 'Goods Receipt Note (GRN - Delivery)';

  return (
    <div className="p-6 space-y-6">
      {/* Mismatch / Status Banner */}
      <MismatchBanner status={matchStatus} reasons={overallReasons} />

      {/* Sub-tab pills for multiple GRNs / Invoices */}
      {documents.length > 1 && (
        <div className="flex items-center space-x-2 bg-slate-200/60 p-1.5 rounded-lg w-fit">
          {documents.map((doc, idx) => {
            const docNum = doc.grnNumber || doc.invoiceNumber || doc.poNumber || `Doc #${idx + 1}`;
            const isSelected = selectedDocIndex === idx;
            return (
              <button
                key={doc._id || idx}
                onClick={() => setSelectedDocIndex(idx)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {doc.grnNumber ? `GRN: ${docNum}` : doc.invoiceNumber ? `Invoice: ${docNum}` : `PO: ${docNum}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Top 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Sections with Colored Accent Bar */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-l-4 border-l-teal-600">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                {documentType === 'po'
                  ? 'Purchase Order Header'
                  : documentType === 'fulfillment'
                  ? 'Invoice Details (Fulfillment)'
                  : 'GRN Details (Delivery)'}
              </h2>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                PO: {poNumber}
              </span>
            </div>

            {currentDoc ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Document No.
                  </label>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {currentDoc.grnNumber || currentDoc.invoiceNumber || currentDoc.poNumber || poNumber}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Document Date
                  </label>
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(currentDoc.grnDate || currentDoc.invoiceDate || currentDoc.poDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Vendor / Supplier
                  </label>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {currentDoc.vendorName || 'M/s AFP'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center flex flex-col items-center justify-center space-y-3">
                <Info className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    No {tabTitle} uploaded for PO #{poNumber}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload this document to perform complete 3-way match reconciliation.
                  </p>
                </div>
                {onOpenUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload {documentType === 'po' ? 'PO' : documentType === 'fulfillment' ? 'Invoice' : 'GRN'} File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Additional Info Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-l-4 border-l-slate-400">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Matching Engine Key Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Line Items</span>
                <span className="font-bold text-slate-800 text-sm">{itemMatches.length}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Unmapped SKUs</span>
                <span className="font-bold text-slate-800 text-sm">
                  {itemMatches.filter((i) => i.unmappedSku).length}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Price Discrepancies</span>
                <span className="font-bold text-slate-800 text-sm">
                  {itemMatches.filter((i) => i.mismatchedCells.priceMismatch).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Original PDF / Image Previewer */}
        <div className="lg:col-span-6 h-[320px]">
          <FilePreview
            documentId={currentDoc?._id}
            filename={currentDoc?.originalFilename}
            mimeType={currentDoc?.mimeType}
          />
        </div>
      </div>

      {/* Bottom: Full-Width Item Grid */}
      <ItemGrid items={itemMatches} />
    </div>
  );
}
