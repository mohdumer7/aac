import mongoose, { Document, Model, Schema } from "mongoose";

import { printerusage } from "@/types/itapplications/printerusage.types";

const PrinterUsageSchema: Schema<printerusage> = new Schema({
    jobAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobAccount", // Reference
        autopopulate: true
    },
    printer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PrinterMaster", // Reference
        autopopulate: true
    },
    date: { type: Date, required: true },
    copyColor: { type: Number, default: 0 },
    copyBw: { type: Number, default: 0 },
    printColor: { type: Number, default: 0 },
    printBw: { type: Number, default: 0 },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })


PrinterUsageSchema.plugin(require('mongoose-autopopulate'));
const PrinterUsage: Model<printerusage> = mongoose.models.PrinterUsage || mongoose.model<printerusage>("PrinterUsage", PrinterUsageSchema)

export default PrinterUsage
