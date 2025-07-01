import mongoose from "mongoose";
export interface jobaccount {
    _id?: mongoose.ObjectId,
    name: string,
    employee: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  