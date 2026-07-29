import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  event_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  org_id: mongoose.Types.ObjectId;
  qr_hash: string;
  used: boolean;
  used_at?: Date;
  created_at: Date;
}

const TicketSchema = new Schema<ITicket>({
  event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  org_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  qr_hash: { type: String, required: true, index: true },
  used: { type: Boolean, default: false },
  used_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
