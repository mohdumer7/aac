import mongoose from "mongoose";
export interface address {
    _id?: mongoose.ObjectId,
    state: string,
    pincode: string,
    country:string,
    area:string,
    location:string,
}
  