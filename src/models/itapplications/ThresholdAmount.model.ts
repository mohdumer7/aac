import mongoose, { Document, Model, Schema } from "mongoose";

import { thresholdamount } from "@/types/itapplications/thresholdamount.types";

const ThresholdAmountSchema: Schema<thresholdamount> = new Schema({
    name: { type: String, required: true, unique:true },
    amount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const ThresholdAmount: Model<thresholdamount> = mongoose.models.ThresholdAmount || mongoose.model<thresholdamount>("ThresholdAmount", ThresholdAmountSchema)

export default ThresholdAmount
