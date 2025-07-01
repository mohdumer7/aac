import mongoose from "mongoose";
export interface buildingType {
    _id?: mongoose.ObjectId,
    name: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  