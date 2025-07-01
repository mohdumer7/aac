import mongoose, { Document, Model, Schema } from "mongoose";

import { incoterm } from "@/types/master/incoterm.types";

const IncotermSchema: Schema<incoterm> = new Schema({
    name: { type: String, required:true, unique:true },
    description: { type: String, required:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Incoterm: Model<incoterm> = mongoose.models.Incoterm || mongoose.model<incoterm>("Incoterm", IncotermSchema)

export default Incoterm
