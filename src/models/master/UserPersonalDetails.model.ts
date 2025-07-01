import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserPersonalDetailsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  gender: string;
  dateOfBirth: Date;
  maritalStatus: string;
  nationality: mongoose.Types.ObjectId;
  personalMobileNo: string;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserPersonalDetailsSchema: Schema<UserPersonalDetailsDocument> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  gender: { 
    type: String,
    enum: ["Male", "Female", "Other",""],
    required:false,
    null: true,
    default: "" 
  },
  dateOfBirth: { type: Date },
  maritalStatus: { 
    type: String,
    enum: ["Single", "Married", "Divorced", "Widowed",""],
    default: "",
    null: true,
    required: false 
  },  
  nationality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    autopopulate: true
  },
  personalMobileNo: { type: String },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });



// Add autopopulate plugin to automatically populate referenced fields
UserPersonalDetailsSchema.plugin(require('mongoose-autopopulate'));

const UserPersonalDetails: Model<UserPersonalDetailsDocument> = 
  mongoose.models.UserPersonalDetails || 
  mongoose.model<UserPersonalDetailsDocument>("UserPersonalDetails", UserPersonalDetailsSchema);

export default UserPersonalDetails; 