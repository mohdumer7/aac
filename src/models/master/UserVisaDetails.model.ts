import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserVisaDetailsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  visaType: mongoose.Types.ObjectId;
  visaIssueDate: Date;
  visaExpiryDate: Date;
  visaFileNo: string;
  workPermit: string;
  labourCardExpiryDate: Date;
  iloeExpiryDate: Date;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserVisaDetailsSchema: Schema<UserVisaDetailsDocument> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  visaType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VisaType",
    autopopulate: true
  },
  visaIssueDate: { type: Date },
  visaExpiryDate: { type: Date },
  visaFileNo: { type: String },
  workPermit: { type: String },
  labourCardExpiryDate: { type: Date },
  iloeExpiryDate: { type: Date },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });



// Add autopopulate plugin to automatically populate referenced fields
UserVisaDetailsSchema.plugin(require('mongoose-autopopulate'));

const UserVisaDetails: Model<UserVisaDetailsDocument> = 
  mongoose.models.UserVisaDetails || 
  mongoose.model<UserVisaDetailsDocument>("UserVisaDetails", UserVisaDetailsSchema);

export default UserVisaDetails; 