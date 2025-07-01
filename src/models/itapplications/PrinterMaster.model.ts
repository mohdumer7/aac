import mongoose, { Document, Model, Schema } from "mongoose";

import { printermaster } from "@/types/itapplications/printermaster.types";

const PrinterMasterSchema: Schema<printermaster> = new Schema({
    name: { type: String, required: true, unique: true },
    printerLocation: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })


PrinterMasterSchema.plugin(require('mongoose-autopopulate'));
const PrinterMaster: Model<printermaster> = mongoose.models.PrinterMaster || mongoose.model<printermaster>("PrinterMaster", PrinterMasterSchema)

export default PrinterMaster
