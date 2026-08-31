import mongoose, { Schema, Document } from 'mongoose';

export interface ISkuMaster extends Document {
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate: number;
  mrp?: number;
  priceTolerance: number; // fraction e.g. 0.05 = 5%
  createdAt?: Date;
  updatedAt?: Date;
}

const SkuMasterSchema = new Schema<ISkuMaster>(
  {
    skuErpCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    eanCode: { type: String, trim: true, default: '' },
    hsnCode: { type: String, default: '' },
    uom: { type: String, default: 'PKT' },
    agreedRate: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
    priceTolerance: { type: Number, default: 0.05 },
  },
  { timestamps: true }
);

export const SkuMaster = mongoose.models.SkuMaster || mongoose.model<ISkuMaster>('SkuMaster', SkuMasterSchema);
