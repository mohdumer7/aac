// src/models/ticket/TicketTask.model.ts
import mongoose, { Document, Model, Query, Schema } from "mongoose";

export interface TicketTaskDocument extends Document {
  ticket: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: string;
  assignee: mongoose.Types.ObjectId;
  dueDate: Date;
  priority: string;
  efforts: number;
  progress: number;
  isActive: boolean;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  reminderSent: boolean;
  reminderDate: Date;
  isOverdue: boolean;
  isRecurring: boolean;
  recurringType: string;
  recurringInterval: number;
  recurringEndDate: Date;
  nextRecurringDate: Date;
  todayCompleted: boolean;
}

const TicketTaskSchema: Schema<TicketTaskDocument> = new Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true, default: "TODO" },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  dueDate: { type: Date },
  priority: { type: String, default: "MEDIUM" },
  efforts: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
  updatedBy: { type: String },
  reminderSent: { type: Boolean, default: false },
  reminderDate: { type: Date },
  isOverdue: { type: Boolean, default: false }
,
  isRecurring: { type: Boolean, default: false },
  recurringType: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'], default: 'WEEKLY' },
  recurringInterval: { type: Number, default: 1 },
  recurringEndDate: { type: Date },
  nextRecurringDate: { type: Date }
,
  todayCompleted: { type: Boolean, default: false }
}, { timestamps: true });

TicketTaskSchema.pre<Query<any, TicketTaskDocument>>(/^find/, function (next) {
  this.populate([
    { path: "assignee" }
  ]);
  next();
});

// Add a pre-save hook to check if the task is overdue
TicketTaskSchema.pre('save', function(next) {
  if (this.dueDate && new Date(this.dueDate) < new Date() && this.status !== 'COMPLETED') {
    this.isOverdue = true;
  } else {
    this.isOverdue = false;
  }
  next();
});

const TicketTask: Model<TicketTaskDocument> = 
  mongoose.models.TicketTask || mongoose.model<TicketTaskDocument>("TicketTask", TicketTaskSchema);

export default TicketTask;