import mongoose, { Document, Model, Schema } from "mongoose";

import { quoteStatus } from "@/types/master/quoteStatus.types";

const QuoteStatusSchema: Schema<quoteStatus> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const QuoteStatus: Model<quoteStatus> = mongoose.models.QuoteStatus || mongoose.model<quoteStatus>("QuoteStatus", QuoteStatusSchema)

export default QuoteStatus
