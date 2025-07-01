import mongoose from "mongoose";
export interface proposal {
    _id?: mongoose.ObjectId,
    revisions: mongoose.ObjectId,
    type: string,
    addedBy: string,
    updatedBy: string
}
