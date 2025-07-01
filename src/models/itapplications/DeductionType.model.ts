import mongoose, { Document, Model, Schema } from "mongoose";

import { deductiontype } from "@/types/itapplications/deductiontype.types";

const DeductionTypeSchema: Schema<deductiontype> = new Schema({
    name: { type: String, required: true, unique:true },
    description: { type: String },
    provider: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProviderType", // Reference
                 autopopulate: true
            },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


DeductionTypeSchema.plugin(require('mongoose-autopopulate'));
const DeductionType: Model<deductiontype> = mongoose.models.DeductionType || mongoose.model<deductiontype>("DeductionType", DeductionTypeSchema)

export default DeductionType
