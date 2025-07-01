import mongoose, { Document, Model, Schema } from "mongoose";

import { providertype } from "@/types/itapplications/providertype.types";

const ProviderTypeSchema: Schema<providertype> = new Schema({
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const ProviderType: Model<providertype> = mongoose.models.ProviderType || mongoose.model<providertype>("ProviderType", ProviderTypeSchema)

export default ProviderType
