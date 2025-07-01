import mongoose, { Document, Model, Schema } from "mongoose";

import { visatype } from "@/types/master/visatype.types";

const VisaTypeSchema: Schema<visatype> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const VisaType: Model<visatype> = mongoose.models.VisaType || mongoose.model<visatype>("VisaType", VisaTypeSchema)

export default VisaType
