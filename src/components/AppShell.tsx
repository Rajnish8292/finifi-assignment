'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  FileCheck,
  FolderOpen,
  Database,
  UploadCloud,
  LogOut,
  Layers,
  Search,
  User,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  poNumber: string;
  onPoNumberChange: (po: string) => void;
  onOpenUpload: () => void;
}

export default function AppShell({
  children,
  poNumber,
  onPoNumberChange,
  onOpenUpload,
}: AppShellProps) {
  const { logout } = useAuth();

  // Fetch list of distinct PO numbers in the database
  const { data: poList = [] } = useQuery<string[]>({
    queryKey: ['po-numbers'],
    queryFn: () => fetchApi('/documents/po-numbers'),
    refetchInterval: 3000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Left Icon Rail */}
      <aside className="w-16 bg-slate-900 flex flex-col items-center py-4 justify-between border-r border-slate-800 shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/50">
            <FileCheck className="w-6 h-6" />
          </div>

          <nav className="flex flex-col gap-3">
            <button
              title="Match Engine"
              className="p-2.5 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              title="SKU Master Catalogue"
              className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Database className="w-5 h-5" />
            </button>
            <button
              title="Audit Logs"
              className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Layers className="w-5 h-5" />
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Rail */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Match Engine</h1>
            <span className="text-slate-300">|</span>

            {/* PO Dropdown Selector & Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="PO Number..."
                  value={poNumber}
                  onChange={(e) => onPoNumberChange(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 w-44"
                />
              </div>

              {poList.length > 0 && (
                <select
                  value={poList.includes(poNumber) ? poNumber : ''}
                  onChange={(e) => {
                    if (e.target.value) onPoNumberChange(e.target.value);
                  }}
                  className="py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="" disabled>
                    Select PO ({poList.length})
                  </option>
                  {poList.map((po) => (
                    <option key={po} value={po}>
                      PO: {po}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
            >
              Swagger API Docs
            </a>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Document
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700">Procurement Admin</span>
            </div>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
