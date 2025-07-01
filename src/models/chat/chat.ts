import mongoose, { Document, Schema } from 'mongoose';
import { Model } from 'mongoose';

export interface IChat extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

const chatSchema: Schema<IChat> = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  timestamp: { type: Date, default: Date.now },
});

const Chat: Model<IChat> = mongoose.models.Ticket || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;