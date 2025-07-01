import mongoose, { Document, Model, Schema } from "mongoose";

import { continent } from "@/types/master/continent.types";

const ContinentSchema: Schema<continent> = new Schema({
    
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Continent: Model<continent> = mongoose.models.Continent || mongoose.model<continent>("Continent", ContinentSchema)

export default Continent
