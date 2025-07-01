import mongoose, { Document, Model, Schema } from "mongoose";

import { paintType } from "@/types/master/paintType.types";

const PaintTypeSchema: Schema<paintType> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const PaintType: Model<paintType> = mongoose.models.PaintType || mongoose.model<paintType>("PaintType", PaintTypeSchema)

export default PaintType
