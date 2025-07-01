import mongoose from "mongoose";
export interface department {
    _id?: mongoose.ObjectId,
    depId: string,
    name: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  