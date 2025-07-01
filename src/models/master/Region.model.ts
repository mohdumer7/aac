import mongoose, { Document, Model, Schema } from "mongoose";

import { region } from "@/types/master/region.types";

const RegionSchema: Schema<region> = new Schema({
   
    name: { type: String, required: true, unique:true },
    continent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Continent", // Reference to the Continent model
            autopopulate: true
        },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

RegionSchema.plugin(require('mongoose-autopopulate'));
const Region: Model<region> = mongoose.models.Region || mongoose.model<region>("Region", RegionSchema)

export default Region
