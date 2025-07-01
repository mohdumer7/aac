import mongoose from "mongoose";
export interface accounthistory {
    _id?: mongoose.ObjectId,
    account: mongoose.ObjectId,
    employee: mongoose.ObjectId,
    others: mongoose.ObjectId,
    package: mongoose.ObjectId,
    startDate: Date,
    endDate: Date,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  