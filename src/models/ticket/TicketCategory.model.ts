// src/models/ticket/TicketCategory.model.ts
import mongoose, { Document, Model, Query, Schema } from "mongoose";

export interface TicketCategoryDocument extends Document {
  name: string;
  department: mongoose.Types.ObjectId;
  description: string;
  isActive: boolean;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketCategorySchema: Schema<TicketCategoryDocument> = new Schema({
  name: { type: String, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

TicketCategorySchema.pre<Query<any, TicketCategoryDocument>>(/^find/, function (next) {
  this.populate([
    { path: "department" }
  ]);
  next();
});

const TicketCategory: Model<TicketCategoryDocument> = 
  mongoose.models.TicketCategory || mongoose.model<TicketCategoryDocument>("TicketCategory", TicketCategorySchema);

export default TicketCategory;