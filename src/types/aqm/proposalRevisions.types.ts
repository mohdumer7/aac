import mongoose, { Mixed } from "mongoose";
export interface proposalRevision {
    _id?: mongoose.ObjectId,
    revNo:number,
    sentToEstimation: Date,
    receivedFromEstimation: Date,
    cycleTime: number,
    sentToCustomer: Date,
    notes: string,
    changes:Mixed,
    addedBy: string,
    updatedBy: string
}
  