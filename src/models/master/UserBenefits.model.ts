import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserBenefitsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  medicalInsurance: string;
  medicalInsuranceStartDate: Date;
  medicalInsuranceEndDate: Date;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserBenefitsSchema: Schema<UserBenefitsDocument> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  medicalInsurance: { type: String },
  medicalInsuranceStartDate: { type: Date },
  medicalInsuranceEndDate: { type: Date },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });



// Add autopopulate plugin to automatically populate referenced fields
UserBenefitsSchema.plugin(require('mongoose-autopopulate'));

const UserBenefits: Model<UserBenefitsDocument> = 
  mongoose.models.UserBenefits || 
  mongoose.model<UserBenefitsDocument>("UserBenefits", UserBenefitsSchema);

export default UserBenefits; 