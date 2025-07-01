import mongoose, { Document, Model, Schema } from "mongoose";

import { packagemaster } from "@/types/itapplications/packagemaster.types";

const PackageMasterSchema: Schema<packagemaster> = new Schema({
    name: { type: String, required: true, unique:true },
    description: { type: String },
    amount: { type: Number, required: true},
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const PackageMaster: Model<packagemaster> = mongoose.models.PackageMaster || mongoose.model<packagemaster>("PackageMaster", PackageMasterSchema)

export default PackageMaster
