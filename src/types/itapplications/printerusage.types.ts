import mongoose from "mongoose";
export interface printerusage {
    _id?: mongoose.ObjectId,
    jobAccount: mongoose.ObjectId,
    printer: mongoose.ObjectId,
    date: Date,
    copyColor: number,
    copyBw: number,
    printColor: number,
    printBw: number,
    addedBy: string,
    updatedBy: string
}
