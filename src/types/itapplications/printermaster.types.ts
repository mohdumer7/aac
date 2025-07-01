import mongoose from "mongoose";
export interface printermaster {
    _id?: mongoose.ObjectId,
    name: string,
    printerLocation: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  