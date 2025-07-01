import mongoose from "mongoose";
export interface customerContacts {
    _id?: mongoose.ObjectId,
    name: string,
    email: string,
    phone: string,
    position: string,
    customer:mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  