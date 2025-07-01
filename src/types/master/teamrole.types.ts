import mongoose from "mongoose";
export interface teamrole {
    _id?: mongoose.ObjectId,
    name: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  