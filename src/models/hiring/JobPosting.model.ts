import mongoose, { Schema, Document } from "mongoose";

export interface JobPostingDocument extends Document {
  requisition: mongoose.Types.ObjectId;
  title: string;
  department: mongoose.Types.ObjectId;
  location: mongoose.Types.ObjectId;
  description: string;
  responsibilities: string[];
  requirements: string[];
  salary?: {
    min?: number;
    max?: number;
    isVisible: boolean;
  };
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Manager' | 'Executive';
  expiryDate: Date;
  isPublished: boolean;
  publishDate?: Date;
  status: 'Draft' | 'Published' | 'Closed' | 'Filled';
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const JobPostingSchema = new Schema<JobPostingDocument>(
  {
    requisition: { type: Schema.Types.ObjectId, ref: 'ManpowerRequisition', required: true },
    title: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    salary: {
      min: { type: Number },
      max: { type: Number },
      isVisible: { type: Boolean, default: false }
    },
    jobType: { 
      type: String, 
      enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
      default: 'Full-time'
    },
    experienceLevel: { 
      type: String, 
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Manager', 'Executive'],
      default: 'Mid Level'
    },
    expiryDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
    publishDate: { type: Date },
    status: { 
      type: String, 
      enum: ['Draft', 'Published', 'Closed', 'Filled'],
      default: 'Draft'
    },
    applicationsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.JobPosting || 
  mongoose.model<JobPostingDocument>("JobPosting", JobPostingSchema); 