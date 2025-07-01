import mongoose, { Document, Model, Schema } from "mongoose";

import { unitMeasurement } from "@/types/master/unitMeasurement.types";

const unitMeasurementSchema: Schema<unitMeasurement> = new Schema({
    
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const UnitMeasurement: Model<unitMeasurement> = mongoose.models.UnitMeasurement || mongoose.model<unitMeasurement>("UnitMeasurement", unitMeasurementSchema)

export default UnitMeasurement
