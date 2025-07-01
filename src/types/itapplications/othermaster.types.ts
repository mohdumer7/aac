import mongoose from "mongoose";
export interface othermaster {
    _id?: mongoose.ObjectId,
    name: string,
    department: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  