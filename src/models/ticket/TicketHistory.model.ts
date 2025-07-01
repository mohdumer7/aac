// src/models/ticket/TicketHistory.model.ts
import mongoose, { Document, Model, Query, Schema } from "mongoose";

export interface TicketHistoryDocument extends Document {
  ticket: mongoose.Types.ObjectId;
  action: string;
  user: mongoose.Types.ObjectId;
  details: object;
  createdAt: Date;
  updatedAt: Date;
}

const TicketHistorySchema: Schema<TicketHistoryDocument> = new Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },
  action: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    autopopulate: true
  },
  details: { type: Object }
}, { timestamps: true });

TicketHistorySchema.pre<Query<any, TicketHistoryDocument>>(/^find/, function (next) {
  this.populate([
    { path: "user" }
  ]);
  next();
});

const TicketHistory: Model<TicketHistoryDocument> = 
  mongoose.models.TicketHistory || mongoose.model<TicketHistoryDocument>("TicketHistory", TicketHistorySchema);
TicketHistorySchema.plugin(require('mongoose-autopopulate'));
export default TicketHistory;