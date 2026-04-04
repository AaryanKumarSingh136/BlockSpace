import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo_url?: string;
  accent_color?: string;
  owner_id: mongoose.Types.ObjectId;
  plan: 'free' | 'pro';
  created_at: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  logo_url: { type: String },
  accent_color: { type: String, default: '#6366F1' },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);