import mongoose from "mongoose";
export interface location {
    _id?: mongoose.ObjectId,
    name: string,
    address: string,
    pincode: string,
    state: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  