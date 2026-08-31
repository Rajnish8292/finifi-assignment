'use client';

import React from 'react';
import { ShoppingCart, Truck, Package, PieChart, Database } from 'lucide-react';

export type TabType = 'po' | 'fulfillment' | 'delivery' | 'summary' | 'sku_master';

interface TopTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  poCount: number;
  invoiceCount: number;
  grnCount: number;
}

export default function TopTabs({
  activeTab,
  onSelectTab,
  poCount,
  invoiceCount,
  grnCount,
}: TopTabsProps) {
  const tabs: Array<{ id: TabType; label: string; count?: number; icon: any }> = [
    { id: 'po', label: 'Purchase Order', count: poCount, icon: ShoppingCart },
    { id: 'fulfillment', label: 'Fulfillment', count: invoiceCount, icon: Package }, // Fulfillment shows Invoices
    { id: 'delivery', label: 'Delivery', count: grnCount, icon: Truck }, // Delivery shows GRNs
    { id: 'summary', label: 'Summary', icon: PieChart },
    { id: 'sku_master', label: 'SKU Master', icon: Database },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6 pt-2">
      <div className="flex space-x-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                isActive
                  ? 'border-teal-600 text-teal-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
