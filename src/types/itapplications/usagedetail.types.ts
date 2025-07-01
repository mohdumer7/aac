import mongoose from "mongoose";
import { deductions } from "./deductions.types";

export interface usagedetail {
    _id?: mongoose.ObjectId,
    account: mongoose.ObjectId,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    grossBillAmount: number,
    oneTimeCharge: number,
    vat: number,
    discount: number,
    netBillAmount: number,
    outstandingAmount: number,
    totalAmountDue: number,
    totalDeduction: number,
    deductions: deductions[],
     waivedAmount: number,
    finalDeduction: number,
    remarks : string,
    addedBy: string,
    updatedBy: string,
    isActive: boolean,
}
