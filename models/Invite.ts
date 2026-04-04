import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  token: string;
  org_id: mongoose.Types.ObjectId;
  email: string;
  role: 'member' | 'manager' | 'orgAdmin';
  expires_at: Date;
  used: boolean;
}

const InviteSchema = new Schema<IInvite>({
  token: { type: String, required: true, unique: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['member', 'manager', 'orgAdmin'], default: 'member' },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);