import mongoose from "mongoose";
export interface region {
    _id?: mongoose.ObjectId,
    name: string,
    continent: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  