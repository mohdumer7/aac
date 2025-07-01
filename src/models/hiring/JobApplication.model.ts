import mongoose, { Schema, Document } from "mongoose";

export interface JobApplicationDocument extends Document {
  jobPosting: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;  // If registered user
  
  // For external applicants
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  resume: string;  // File path or URL
  coverLetter?: string;
  
  experience: number;  // In years
  currentCompany?: string;
  currentPosition?: string;
  currentSalary?: number;
  expectedSalary?: number;
  
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
  }[];
  
  skills: string[];
  
  // Application tracking
  status: 'Applied' | 'Screening' | 'Interview Scheduled' | 'Technical Assessment' | 
          'HR Interview' | 'Offered' | 'Accepted' | 'Rejected' | 'Withdrawn';
  
  // Interview stages
  interviews: {
    scheduledDate: Date;
    interviewers: mongoose.Types.ObjectId[];
    interviewType: 'Phone' | 'Video' | 'In-person' | 'Technical' | 'HR';
    feedback?: string;
    rating?: number;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  }[];
  
  // Notes from recruiters
  notes: {
    note: string;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
  }[];
  
  // If an offer is made
  offer?: {
    salary: number;
    benefits: string;
    startDate: Date;
    expiryDate: Date;
    status: 'Preparing' | 'Sent' | 'Accepted' | 'Negotiating' | 'Declined' | 'Expired';
  };
  
  // If hired, reference to the user
  hiredUser?: mongoose.Types.ObjectId;
  
  // Tracking
  appliedDate: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const JobApplicationSchema = new Schema<JobApplicationDocument>(
  {
    jobPosting: { type: Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    applicant: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // For external applicants
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    
    resume: { type: String, required: true },  // File path or URL
    coverLetter: { type: String },
    
    experience: { type: Number, required: true },
    currentCompany: { type: String },
    currentPosition: { type: String },
    currentSalary: { type: Number },
    expectedSalary: { type: Number },
    
    education: [{
      degree: { type: String, required: true },
      institution: { type: String, required: true },
      graduationYear: { type: Number, required: true }
    }],
    
    skills: [{ type: String }],
    
    // Application tracking
    status: { 
      type: String, 
      enum: [
        'Applied', 'Screening', 'Interview Scheduled', 'Technical Assessment',
        'HR Interview', 'Offered', 'Accepted', 'Rejected', 'Withdrawn'
      ],
      default: 'Applied'
    },
    
    // Interview stages
    interviews: [{
      scheduledDate: { type: Date, required: true },
      interviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      interviewType: { 
        type: String, 
        enum: ['Phone', 'Video', 'In-person', 'Technical', 'HR'],
        required: true
      },
      feedback: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      status: { 
        type: String, 
        enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
        default: 'Scheduled'
      }
    }],
    
    // Notes from recruiters
    notes: [{
      note: { type: String, required: true },
      addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      addedAt: { type: Date, default: Date.now }
    }],
    
    // If an offer is made
    offer: {
      salary: { type: Number },
      benefits: { type: String },
      startDate: { type: Date },
      expiryDate: { type: Date },
      status: { 
        type: String, 
        enum: ['Preparing', 'Sent', 'Accepted', 'Negotiating', 'Declined', 'Expired'],
      }
    },
    
    // If hired, reference to the user
    hiredUser: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // Tracking
    appliedDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.JobApplication || 
  mongoose.model<JobApplicationDocument>("JobApplication", JobApplicationSchema); 