import mongoose from "mongoose";
export interface country {
    _id?: mongoose.ObjectId,
    countryCode: string,
    name: string,
    region: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  