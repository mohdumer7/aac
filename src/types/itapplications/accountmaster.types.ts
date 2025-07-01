import mongoose from "mongoose";
export interface accountmaster {
    _id?: mongoose.ObjectId,
    name: string,
    provider: mongoose.ObjectId,
    company: mongoose.ObjectId,
    employee: mongoose.ObjectId,
    others: mongoose.ObjectId,
    package: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  