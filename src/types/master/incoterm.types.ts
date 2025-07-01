import mongoose from "mongoose";
export interface incoterm {
    _id?: mongoose.ObjectId,
    name: string,
    description: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  