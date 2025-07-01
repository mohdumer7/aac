import mongoose from "mongoose";
export interface smlsubgroup {
    _id?: mongoose.ObjectId,
    name: string,
    group: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
} 