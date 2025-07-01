import mongoose from "mongoose";
export interface packagemaster {
    _id?: mongoose.ObjectId,
    name: string,
    description: string,
    amount: number,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  