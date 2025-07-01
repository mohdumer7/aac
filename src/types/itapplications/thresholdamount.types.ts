import mongoose from "mongoose";
export interface thresholdamount {
    _id?: mongoose.ObjectId,
    name: string,
    amount: number,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  