import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  itemCode: string;
  description: string;
  quantity: number;
  unitRate?: number;
  mrp?: number;
  skuMaster?: mongoose.Types.ObjectId | null;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  poDate: Date;
  vendorName: string;
  items: IPOItem[];
  rawParsed: any;
  filePath: string;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>({
  itemCode: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 0 },
  unitRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, index: true },
    poDate: { type: Date, required: true },
    vendorName: { type: String, default: '' },
    items: [POItemSchema],
    rawParsed: { type: Schema.Types.Mixed },
    filePath: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: 'application/pdf' },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
