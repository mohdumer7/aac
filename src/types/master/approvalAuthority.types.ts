import mongoose from "mongoose";
export interface approvalAuthority {
    _id?: mongoose.ObjectId,
    code: string,
    name: string,
    location: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  