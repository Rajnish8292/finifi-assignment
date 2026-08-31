'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SkuMasterItem } from '@/types';

export default function SkuMasterManagement() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<SkuMasterItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [skuErpCode, setSkuErpCode] = useState('');
  const [name, setName] = useState('');
  const [eanCode, setEanCode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [uom, setUom] = useState('PKT');
  const [agreedRate, setAgreedRate] = useState('');
  const [mrp, setMrp] = useState('');
  const [priceTolerance, setPriceTolerance] = useState('0.05');

  // Fetch SKU list
  const { data: skus = [], isLoading, error } = useQuery<SkuMasterItem[]>({
    queryKey: ['skus'],
    queryFn: () => fetchApi('/masters/sku'),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi('/masters/sku', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setSuccessMessage('SKU Master record created successfully!');
      closeModal();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to create SKU Master');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi(`/masters/sku/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setSuccessMessage('SKU Master record updated successfully!');
      closeModal();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update SKU Master');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/masters/sku/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      setSuccessMessage('SKU Master record deleted successfully!');
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to delete SKU Master');
    },
  });

  const openCreateModal = () => {
    setEditingSku(null);
    setSkuErpCode('');
    setName('');
    setEanCode('');
    setHsnCode('');
    setUom('PKT');
    setAgreedRate('');
    setMrp('');
    setPriceTolerance('0.05');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (sku: SkuMasterItem) => {
    setEditingSku(sku);
    setSkuErpCode(sku.skuErpCode);
    setName(sku.name);
    setEanCode(sku.eanCode || '');
    setHsnCode(sku.hsnCode || '');
    setUom(sku.uom || 'PKT');
    setAgreedRate(String(sku.agreedRate));
    setMrp(sku.mrp ? String(sku.mrp) : '');
    setPriceTolerance(sku.priceTolerance !== undefined ? String(sku.priceTolerance) : '0.05');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSku(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!skuErpCode.trim() || !name.trim() || !agreedRate) {
      setErrorMessage('ERP Code, SKU Name, and Contracted Rate are required fields.');
      return;
    }

    const payload = {
      skuErpCode: skuErpCode.trim(),
      name: name.trim(),
      eanCode: eanCode.trim(),
      hsnCode: hsnCode.trim(),
      uom: uom.trim(),
      agreedRate: Number(agreedRate),
      mrp: mrp ? Number(mrp) : 0,
      priceTolerance: Number(priceTolerance),
    };

    if (editingSku) {
      updateMutation.mutate({ id: editingSku._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredSkus = skus.filter(
    (s) =>
      s.skuErpCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.eanCode && s.eanCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">
            SKU Master Catalogue Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contracted unit rates, MRPs, EAN lookup codes, and price tolerances for 3-way match resolution.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New SKU Record
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter by ERP Code, SKU Name, or EAN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">ERP Code</th>
                <th className="py-3 px-4">SKU Name</th>
                <th className="py-3 px-4">EAN Code</th>
                <th className="py-3 px-4">HSN</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4 text-right">Contracted Rate</th>
                <th className="py-3 px-4 text-right">MRP</th>
                <th className="py-3 px-4 text-right">Price Tolerance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Loading SKU Master catalogue...
                  </td>
                </tr>
              ) : filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No SKU Master records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((sku) => (
                  <tr key={sku._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{sku.skuErpCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{sku.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{sku.eanCode || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{sku.hsnCode || '-'}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{sku.uom || 'PKT'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{sku.agreedRate?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      ₹{(sku.mrp || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {((sku.priceTolerance ?? 0.05) * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(sku)}
                          title="Edit Record"
                          className="p-1 hover:bg-slate-100 text-slate-600 hover:text-teal-600 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete SKU Master record ${sku.skuErpCode}?`)) {
                              deleteMutation.mutate(sku._id);
                            }
                          }}
                          title="Delete Record"
                          className="p-1 hover:bg-slate-100 text-slate-600 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingSku ? `Edit SKU: ${editingSku.skuErpCode}` : 'Add New SKU Master Record'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ERP SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={skuErpCode}
                    onChange={(e) => setSkuErpCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. 11423"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    EAN Code (Lookup Key)
                  </label>
                  <input
                    type="text"
                    value={eanCode}
                    onChange={(e) => setEanCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. FG-P-F-0503"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Cheesy Spicy Veg Momos 24 Pcs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="19022010"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UOM</label>
                  <input
                    type="text"
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="PKT"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price Tolerance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceTolerance}
                    onChange={(e) => setPriceTolerance(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="0.05 = 5%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contracted Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={agreedRate}
                    onChange={(e) => setAgreedRate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-teal-700"
                    placeholder="220.76"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="305.00"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  {editingSku ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
