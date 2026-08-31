import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  itemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  mrp?: number;
  skuMaster?: mongoose.Types.ObjectId | null;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  poNumber: string;
  invoiceDate: Date;
  items: IInvoiceItem[];
  rawParsed: any;
  filePath: string;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  itemCode: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 0 },
  unitRate: { type: Number, required: true, default: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true },
    poNumber: { type: String, required: true, index: true },
    invoiceDate: { type: Date, required: true },
    items: [InvoiceItemSchema],
    rawParsed: { type: Schema.Types.Mixed },
    filePath: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: 'application/pdf' },
  },
  { timestamps: true }
);

export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
