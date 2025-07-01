import mongoose, { Document, Model, Schema } from "mongoose";

import { department } from "@/types/master/department.types";

const DepartmentSchema: Schema<department> = new Schema({
    depId: { type: String, required:true, unique:true},
    name: { type: String, required: true, unique:true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const Department: Model<department> = mongoose.models.Department || mongoose.model<department>("Department", DepartmentSchema)

export default Department
