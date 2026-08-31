'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import AppShell from '@/components/AppShell';
import TopTabs, { TabType } from '@/components/TopTabs';
import DocumentDetailView from '@/components/DocumentDetailView';
import SummaryTab from '@/components/SummaryTab';
import SkuMasterManagement from '@/components/SkuMasterManagement';
import UploadModal from '@/components/UploadModal';
import { ThreeWayMatchResult, SummaryData } from '@/types';

export default function HomePage() {
  const [poNumber, setPoNumber] = useState('CI4PO05788');
  const [activeTab, setActiveTab] = useState<TabType>('po');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch dynamic Three-Way Match result (always recomputes from database)
  const { data: matchResult } = useQuery<ThreeWayMatchResult>({
    queryKey: ['match', poNumber],
    queryFn: () => fetchApi(`/match/${poNumber}`),
    enabled: !!poNumber,
  });

  // Fetch PO Summary stats and document history
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery<SummaryData>({
    queryKey: ['summary', poNumber],
    queryFn: () => fetchApi(`/summary/${poNumber}`),
    enabled: !!poNumber,
  });

  // Fetch document lists for current PO
  const { data: rawDocuments = [] } = useQuery<any[]>({
    queryKey: ['documents', poNumber],
    queryFn: () => fetchApi(`/documents?poNumber=${poNumber}`),
    enabled: !!poNumber,
  });

  const handleUploadSuccess = (uploadedPoNumber: string, docType: 'po' | 'grn' | 'invoice') => {
    if (uploadedPoNumber) setPoNumber(uploadedPoNumber);

    // Switch tab to uploaded document type
    if (docType === 'po') setActiveTab('po');
    else if (docType === 'invoice') setActiveTab('fulfillment');
    else if (docType === 'grn') setActiveTab('delivery');

    // Invalidate all React Query cache to immediately refetch fresh data
    queryClient.invalidateQueries();
  };

  const poDocs = rawDocuments.filter((d) => d.documentType === 'po');
  const invoiceDocs = rawDocuments.filter((d) => d.documentType === 'invoice');
  const grnDocs = rawDocuments.filter((d) => d.documentType === 'grn');

  return (
    <AppShell
      poNumber={poNumber}
      onPoNumberChange={setPoNumber}
      onOpenUpload={() => setIsUploadOpen(true)}
    >
      <TopTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        poCount={matchResult?.documentsFound?.poCount || poDocs.length || 0}
        invoiceCount={matchResult?.documentsFound?.invoiceCount || invoiceDocs.length || 0}
        grnCount={matchResult?.documentsFound?.grnCount || grnDocs.length || 0}
      />

      {activeTab === 'po' && (
        <DocumentDetailView
          documentType="po"
          poNumber={poNumber}
          matchStatus={matchResult?.status || 'insufficient_documents'}
          overallReasons={matchResult?.overallReasons || []}
          documents={poDocs}
          itemMatches={matchResult?.itemMatches || []}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      )}

      {activeTab === 'fulfillment' && (
        <DocumentDetailView
          documentType="fulfillment"
          poNumber={poNumber}
          matchStatus={matchResult?.status || 'insufficient_documents'}
          overallReasons={matchResult?.overallReasons || []}
          documents={invoiceDocs}
          itemMatches={matchResult?.itemMatches || []}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      )}

      {activeTab === 'delivery' && (
        <DocumentDetailView
          documentType="delivery"
          poNumber={poNumber}
          matchStatus={matchResult?.status || 'insufficient_documents'}
          overallReasons={matchResult?.overallReasons || []}
          documents={grnDocs}
          itemMatches={matchResult?.itemMatches || []}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      )}

      {activeTab === 'summary' && (
        <SummaryTab summaryData={summaryData || null} loading={isSummaryLoading} />
      )}

      {activeTab === 'sku_master' && <SkuMasterManagement />}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </AppShell>
  );
}
