import mongoose from "mongoose";
export interface teamMember {
    _id?: mongoose.ObjectId,
    user: mongoose.ObjectId,
    teamRole: mongoose.ObjectId,
    teamReportingTo: mongoose.ObjectId,
    team: mongoose.ObjectId,
    addedBy: string,
    updatedBy: string,
    isActive:boolean,
}
  