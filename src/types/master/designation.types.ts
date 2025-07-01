import mongoose from "mongoose";
export interface designation {
    _id?: mongoose.ObjectId,
    name: string,
    department: mongoose.Types.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  