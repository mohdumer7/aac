import mongoose from "mongoose";
export interface option {
    _id?: mongoose.ObjectId,
    name:string,
    proposals: mongoose.ObjectId,
}
