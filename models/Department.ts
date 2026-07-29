import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  club_id: mongoose.Types.ObjectId;
  org_id: mongoose.Types.ObjectId;
  admin_id?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true },
  description: { type: String },
  club_id: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  admin_id: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
