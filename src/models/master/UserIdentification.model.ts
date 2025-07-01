import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserIdentificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  passportNumber: string;
  passportIssueDate: Date;
  passportExpiryDate: Date;
  emiratesId: string;
  emiratesIdIssueDate: Date;
  emiratesIdExpiryDate: Date;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserIdentificationSchema: Schema<UserIdentificationDocument> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  passportNumber: { type: String },
  passportIssueDate: { type: Date },
  passportExpiryDate: { type: Date },
  emiratesId: { type: String },
  emiratesIdIssueDate: { type: Date },
  emiratesIdExpiryDate: { type: Date },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });


// Add autopopulate plugin to automatically populate referenced fields
UserIdentificationSchema.plugin(require('mongoose-autopopulate'));

const UserIdentification: Model<UserIdentificationDocument> = 
  mongoose.models.UserIdentification || 
  mongoose.model<UserIdentificationDocument>("UserIdentification", UserIdentificationSchema);

export default UserIdentification; 