import mongoose from "mongoose";
export interface deductiontype {
    _id?: mongoose.ObjectId,
    name: string,
    description: string,
    provider: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  