import mongoose, { Document, Model, Schema } from "mongoose";

import { role } from "@/types/master/role.types";

const RoleSchema: Schema<role> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Role: Model<role> = mongoose.models.Role || mongoose.model<role>("Role", RoleSchema)

export default Role
