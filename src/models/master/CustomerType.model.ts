import mongoose, { Document, Model, Schema } from "mongoose";

import { customerType } from "@/types/master/customerType.types";

const CustomerTypeSchema: Schema<customerType> = new Schema({
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const CustomerType: Model<customerType> = mongoose.models.CustomerType || mongoose.model<customerType>("CustomerType", CustomerTypeSchema)

export default CustomerType
