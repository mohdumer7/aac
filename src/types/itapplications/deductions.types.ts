import mongoose from "mongoose";
export interface deductions {
    deductionType: mongoose.ObjectId,
    amount: number
}
  