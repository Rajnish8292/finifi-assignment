import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNItem {
  itemCode: string;
  description: string;
  receivedQuantity: number;
  mrp?: number;
  skuMaster?: mongoose.Types.ObjectId | null;
}

export interface IGrn extends Document {
  grnNumber: string;
  poNumber: string;
  grnDate: Date;
  items: IGRNItem[];
  rawParsed: any;
  filePath: string;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>({
  itemCode: { type: String, required: true },
  description: { type: String, default: '' },
  receivedQuantity: { type: Number, required: true, default: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
});

const GrnSchema = new Schema<IGrn>(
  {
    grnNumber: { type: String, required: true },
    poNumber: { type: String, required: true, index: true },
    grnDate: { type: Date, required: true },
    items: [GRNItemSchema],
    rawParsed: { type: Schema.Types.Mixed },
    filePath: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: 'application/pdf' },
  },
  { timestamps: true }
);

export const Grn = mongoose.models.Grn || mongoose.model<IGrn>('Grn', GrnSchema);
