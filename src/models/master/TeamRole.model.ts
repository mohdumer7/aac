import mongoose, { Document, Model, Schema } from "mongoose";

import { teamrole } from "@/types/master/teamrole.types";

const RoleSchema: Schema<teamrole> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const TeamRole: Model<teamrole> = mongoose.models.TeamRole || mongoose.model<teamrole>("TeamRole", RoleSchema)

export default TeamRole
