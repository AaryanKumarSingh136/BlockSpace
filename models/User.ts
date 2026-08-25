import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'member' | 'manager' | 'orgAdmin' | 'superAdmin';
  org_id?: mongoose.Types.ObjectId;
  club_id?: mongoose.Types.ObjectId;
  dept_id?: mongoose.Types.ObjectId;
  joined_at: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['member', 'manager', 'orgAdmin', 'superAdmin'],
    default: 'member',
  },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization' },
  club_id: { type: Schema.Types.ObjectId, ref: 'Club' },
  dept_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  joined_at: { type: Date, default: Date.now },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);