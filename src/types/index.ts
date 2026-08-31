export interface SkuMasterItem {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate: number;
  mrp?: number;
  priceTolerance: number;
  createdAt?: string;
}

export interface ItemMatchDetail {
  itemKey: string;
  skuMasterId?: string | null;
  skuErpCode?: string;
  name: string;
  mappedSkuName?: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  unitPrice: number;
  agreedRate?: number;
  unitMrp: number;
  skuMrp?: number;
  grossAmount: number;
  unmappedSku: boolean;
  itemReasons: string[];
  mismatchedCells: {
    priceMismatch: boolean;
    mrpMismatch: boolean;
    qtyMismatch: boolean;
  };
}

export interface ThreeWayMatchResult {
  poNumber: string;
  status: 'insufficient_documents' | 'mismatch' | 'partially_matched' | 'matched';
  overallReasons: string[];
  documentsFound: {
    hasPO: boolean;
    poCount: number;
    grnCount: number;
    invoiceCount: number;
  };
  itemMatches: ItemMatchDetail[];
  linkedDocs: {
    pos: Array<{ _id: string; poNumber: string; poDate: string; vendorName: string }>;
    grns: Array<{ _id: string; grnNumber: string; grnDate: string }>;
    invoices: Array<{ _id: string; invoiceNumber: string; invoiceDate: string }>;
  };
}

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
    date: string;
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
