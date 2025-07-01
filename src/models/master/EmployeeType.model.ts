import mongoose, { Document, Model, Schema } from "mongoose";

import { employeeType } from "@/types/master/employeeType.types";

const EmployeTypeSchema: Schema<employeeType> = new Schema({
    name: { type: String, required:true, unique:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const EmployeeType: Model<employeeType> = mongoose.models.EmployeeType || mongoose.model<employeeType>("EmployeeType", EmployeTypeSchema)

export default EmployeeType
