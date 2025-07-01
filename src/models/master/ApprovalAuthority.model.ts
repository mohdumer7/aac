import mongoose, { Document, Model, Schema } from "mongoose";

import { approvalAuthority } from "@/types/master/approvalAuthority.types";

const ApprovalAuthoritySchema: Schema<approvalAuthority> = new Schema({
    code: { type: String, required:true, unique:true },
    name: { type: String, required:true, unique:true },
    location: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location", // Reference to the Location model
          autopopulate: true, // Automatically populate this field
        },
      ],
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

ApprovalAuthoritySchema.plugin(require('mongoose-autopopulate'));
const ApprovalAuthority: Model<approvalAuthority> = mongoose.models.ApprovalAuthority || mongoose.model<approvalAuthority>("ApprovalAuthority", ApprovalAuthoritySchema)

export default ApprovalAuthority
