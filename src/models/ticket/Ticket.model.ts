// src/models/ticket/Ticket.model.ts
import mongoose, { Document, Model, Schema, Query } from "mongoose";

export interface TicketDocument extends Document {
  title: string;
  description: string;
  status: string;
  priority: string;
  department: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  assignee?: mongoose.Types.ObjectId; // For backward compatibility
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  addedBy: string;
  updatedBy: string;
  efforts: number;
  totalEfforts: number;
  roomId: string;
  isRecurring: boolean;
  recurringType: string;
  recurringEndDate?: Date;
  recurringInterval?: number;
  nextRecurringDate?: Date;
  child?: number; // Add the 'child' field to match the schema
}

const TicketSchema: Schema<TicketDocument> = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true, default: "NEW" },
  priority: { type: String, required: true, default: "MEDIUM" },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TicketCategory",
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  }],
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // Kept for backward compatibility
  },
  dueDate: { type: Date },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
  updatedBy: { type: String },
  efforts: { type: Number, default: 0 },
  totalEfforts: { type: Number, default: 0 },
  roomId: { type: String, default: () => `room-${new mongoose.Types.ObjectId().toString()}` },
  isRecurring: { type: Boolean, default: false },
  recurringType: { 
    type: String, 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], 
    default: 'WEEKLY' 
  },
  recurringEndDate: { type: Date },
  recurringInterval: { type: Number, default: 1 }, // For custom intervals
  nextRecurringDate: { type: Date },
  child: { type: Number, ref: 'Child', autopopulate: true }
}, { timestamps: true });

TicketSchema.pre<Query<any, TicketDocument>>(/^find/, function (next) {
  this.populate([
    { path: "department" },
    { path: "category" },
    { path: "creator" },
    { path: "assignee" },
    { path: "assignees" }
  ]);
  next();
});
TicketSchema.plugin(require('mongoose-autopopulate'));
const Ticket: Model<TicketDocument> = mongoose.models.Ticket || mongoose.model<TicketDocument>("Ticket", TicketSchema);

export default Ticket;