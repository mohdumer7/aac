import mongoose, { Document, Model, Schema } from "mongoose";

import { industryType } from "@/types/master/industryType.types";

const IndustryTypeSchema: Schema<industryType> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const IndustryType: Model<industryType> = mongoose.models.IndustryType || mongoose.model<industryType>("IndustryType", IndustryTypeSchema)

export default IndustryType
