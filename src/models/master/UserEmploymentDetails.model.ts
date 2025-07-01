import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserEmploymentDetailsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  empId: string;
  department: mongoose.Types.ObjectId;
  designation: mongoose.Types.ObjectId;
  reportingTo: mongoose.Types.ObjectId;
  employeeType: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
  reportingLocation: mongoose.Types.ObjectId;
  activeLocation: mongoose.Types.ObjectId;
  extension: string;
  workMobile: string;
  joiningDate: Date;
  relievingDate: Date;
  organisation: mongoose.Types.ObjectId;
  personCode: string;
  status: string;
  availability: string;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserEmploymentDetailsSchema: Schema<UserEmploymentDetailsDocument> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  empId: { type: String, unique: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    autopopulate: true
  },
  designation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation",
    autopopulate: true
  },
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    autopopulate: {
      select: "firstName lastName displayName email"
    }
  },
  employeeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmployeeType",
    autopopulate: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    autopopulate: true
  },
  reportingLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    autopopulate: true
  },
  activeLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    autopopulate: true
  },
  extension: { type: String },
  workMobile: { type: String },
  joiningDate: { type: Date },
  relievingDate: { type: Date },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    autopopulate: true
  },
  personCode: { type: String },
  status: { 
    type: String,
    enum: ["Active", "On Leave", "Terminated", "Resigned", ""],
    default: "Active",
    null: true
  },
  availability: { 
    type: String,
    enum: ["Available", "Busy", "Away", "In Meeting", "On Leave",""],
    default: "Available",
    null: true,
  },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });



// Add autopopulate plugin to automatically populate referenced fields
UserEmploymentDetailsSchema.plugin(require('mongoose-autopopulate'));

const UserEmploymentDetails: Model<UserEmploymentDetailsDocument> = 
  mongoose.models.UserEmploymentDetails || 
  mongoose.model<UserEmploymentDetailsDocument>("UserEmploymentDetails", UserEmploymentDetailsSchema);

export default UserEmploymentDetails; 