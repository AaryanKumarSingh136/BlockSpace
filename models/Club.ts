import mongoose, { Schema, Document } from 'mongoose';

export interface IClub extends Document {
  name: string;
  description?: string;
  org_id: mongoose.Types.ObjectId;
  admin_id?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

const ClubSchema = new Schema<IClub>({
  name: { type: String, required: true },
  description: { type: String },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  admin_id: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Club || mongoose.model<IClub>('Club', ClubSchema);
