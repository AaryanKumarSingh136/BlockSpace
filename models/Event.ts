import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  organizer_id: mongoose.Types.ObjectId;
  org_id: mongoose.Types.ObjectId;
  club_id?: mongoose.Types.ObjectId;
  dept_id?: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  capacity: number;
  attendee_list: mongoose.Types.ObjectId[];
  qr_secret: string;
  is_public: boolean;
  created_at: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String },
  organizer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  club_id: { type: Schema.Types.ObjectId, ref: 'Club' },
  dept_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  capacity: { type: Number, required: true, default: 100 },
  attendee_list: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  qr_secret: { type: String, required: true },
  is_public: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
