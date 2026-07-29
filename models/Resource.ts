import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  name: string;
  type: 'room' | 'desk' | 'equipment' | 'court';
  capacity?: number;
  org_id: mongoose.Types.ObjectId;
  club_id?: mongoose.Types.ObjectId;
  dept_id?: mongoose.Types.ObjectId;
  current_status: 'available' | 'occupied' | 'maintenance';
  created_at: Date;
}

const ResourceSchema = new Schema<IResource>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['room', 'desk', 'equipment', 'court'],
    required: true,
  },
  capacity: { type: Number },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  club_id: { type: Schema.Types.ObjectId, ref: 'Club' },
  dept_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  current_status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available',
  },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);