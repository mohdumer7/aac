import mongoose from "mongoose";
export interface unitMeasurement {
    _id?: mongoose.ObjectId,
    name: string,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  