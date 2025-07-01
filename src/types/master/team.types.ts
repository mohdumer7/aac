import mongoose from "mongoose";
export interface team {
    _id?: mongoose.ObjectId,
    name: string,
    teamHead: mongoose.ObjectId[],
    department: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,

}
  