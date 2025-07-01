import mongoose, { Document, Model, Schema } from "mongoose";

import { sector } from "@/types/master/sector.types";

const SectorSchema: Schema<sector> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Sector: Model<sector> = mongoose.models.Sector || mongoose.model<sector>("Sector", SectorSchema)

export default Sector
