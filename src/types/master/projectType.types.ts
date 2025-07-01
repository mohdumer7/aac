import mongoose from "mongoose";
export interface projectType {
    _id?: mongoose.ObjectId,
    name: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  