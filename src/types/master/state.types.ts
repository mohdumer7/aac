import mongoose from "mongoose";
export interface state {
    _id?: mongoose.ObjectId,
    name: string,
    country: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  