'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import { getFilePreviewUrl } from '@/lib/api';

interface FilePreviewProps {
  documentId?: string;
  filename?: string;
  mimeType?: string;
}

export default function FilePreview({ documentId, filename, mimeType }: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 50));
  const handleResetZoom = () => setZoom(100);

  if (!documentId) {
    return (
      <div className="h-full bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">No Document Selected</p>
        <p className="text-xs text-slate-400 mt-1">Upload or select a document to preview the original file.</p>
      </div>
    );
  }

  const fileUrl = getFilePreviewUrl(documentId);
  const isImage = mimeType?.startsWith('image/');

  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-inner">
      {/* Zoom Control Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-700 px-4 flex items-center justify-between text-slate-300 shrink-0">
        <span className="text-xs font-medium truncate max-w-[200px]" title={filename || 'Document'}>
          {filename || 'Original Document Preview'}
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono w-10 text-center font-bold text-slate-400">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors ml-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-auto p-2 flex justify-center bg-slate-950/60">
        <div
          style={{ width: `${zoom}%`, transition: 'width 0.15s ease' }}
          className="h-full min-h-[450px] flex items-center justify-center"
        >
          {isImage ? (
            <img
              src={fileUrl}
              alt={filename || 'Document Preview'}
              className="max-w-full max-h-full object-contain rounded shadow"
            />
          ) : (
            <iframe
              src={fileUrl}
              title="Document PDF Preview"
              className="w-full h-full min-h-[450px] bg-white rounded border border-slate-700"
            />
          )}
        </div>
      </div>
    </div>
  );
}
