import mongoose, { Document, Model, Schema } from "mongoose";

import { currency } from "@/types/master/currency.types";

const CurrencySchema: Schema<currency> = new Schema({
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Currency: Model<currency> = mongoose.models.Currency || mongoose.model<currency>("Currency", CurrencySchema)

export default Currency
