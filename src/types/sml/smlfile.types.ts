import mongoose from "mongoose";
export interface smlfile {
    _id?: mongoose.ObjectId,
    fileName: string,
    description: string,
    fileSize: number,
    revNo: number,
    subGroup: mongoose.ObjectId,
    fileId: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
} 