import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  resource_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  org_id: mongoose.Types.ObjectId;
  title: string;
  start_time: Date;
  end_time: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: Date;
}

const BookingSchema = new Schema<IBooking>({
  resource_id: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  is_recurring: { type: Boolean, default: false },
  recurrence_rule: { type: String },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);