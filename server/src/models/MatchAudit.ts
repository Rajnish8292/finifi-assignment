import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditStep {
  step: string;
  status: string;
  message: string;
  at: Date;
}

export interface IMatchAudit extends Document {
  poNumber: string;
  steps: IAuditStep[];
  createdAt: Date;
  updatedAt: Date;
}

const AuditStepSchema = new Schema<IAuditStep>({
  step: { type: String, required: true },
  status: { type: String, required: true },
  message: { type: String, required: true },
  at: { type: Date, default: Date.now },
});

const MatchAuditSchema = new Schema<IMatchAudit>(
  {
    poNumber: { type: String, required: true, index: true },
    steps: [AuditStepSchema],
  },
  { timestamps: true }
);

export const MatchAudit = mongoose.models.MatchAudit || mongoose.model<IMatchAudit>('MatchAudit', MatchAuditSchema);
