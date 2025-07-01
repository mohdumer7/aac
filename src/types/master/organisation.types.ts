import mongoose from "mongoose";
export interface organisation {
    _id?: mongoose.ObjectId,
    name: string,
    location: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  