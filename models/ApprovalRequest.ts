import mongoose, { Schema, Document } from 'mongoose';

export interface IApprovalRequest extends Document {
  type: 'club_creation' | 'department_creation' | 'role_promotion';
  org_id: mongoose.Types.ObjectId;
  club_id?: mongoose.Types.ObjectId;
  dept_id?: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  target_user_id?: mongoose.Types.ObjectId;
  proposed_role?: 'member' | 'manager' | 'orgAdmin' | 'superAdmin';
  details?: {
    name?: string;
    description?: string;
    club_id?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  created_at: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>({
  type: {
    type: String,
    enum: ['club_creation', 'department_creation', 'role_promotion'],
    required: true,
  },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  club_id: { type: Schema.Types.ObjectId, ref: 'Club' },
  dept_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  requested_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  target_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  proposed_role: {
    type: String,
    enum: ['member', 'manager', 'orgAdmin', 'superAdmin'],
  },
  details: {
    name: { type: String },
    description: { type: String },
    club_id: { type: String },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.ApprovalRequest || mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
