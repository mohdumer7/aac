import mongoose, { Document, Model, Schema } from "mongoose";

import { deductions } from "@/types/itapplications/deductions.types";
import { usagedetail } from "@/types/itapplications/usagedetail.types";

const deductionSchema: Schema<deductions> = new Schema({
    deductionType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeductionType',
        required: true,
        autopopulate: true
    },
    amount: { type: Number, default: 0 },

}, { _id: false });

const UsageDetailSchema: Schema<usagedetail> = new Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountMaster',
        required: true,
        autopopulate: true
    },
    billingPeriodStart: { type: Date },
    billingPeriodEnd: { type: Date },
    grossBillAmount: { type: Number, required: true },
    oneTimeCharge: { type: Number, default: 0 },
    vat: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    netBillAmount: { type: Number, required:true },
    outstandingAmount: { type: Number, default: 0 },
    totalAmountDue: { type: Number },
    totalDeduction: { type: Number, default:0 },
    deductions: [deductionSchema],
    waivedAmount: { type: Number, default: 0},
    finalDeduction: { type: Number,default: 0,},
    remarks: { type: String},
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })

UsageDetailSchema.plugin(require('mongoose-autopopulate'));
const UsageDetail: Model<usagedetail> = mongoose.models.UsageDetail || mongoose.model<usagedetail>("UsageDetail", UsageDetailSchema)

export default UsageDetail
