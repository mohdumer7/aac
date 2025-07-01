import mongoose, { Document, Model, Schema } from "mongoose";

import { buildingType } from "@/types/master/buildingType";

const BuildingTypeSchema: Schema<buildingType> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

const BuildingType: Model<buildingType> = mongoose.models.BuildingType || mongoose.model<buildingType>("BuildingType", BuildingTypeSchema)

export default BuildingType
