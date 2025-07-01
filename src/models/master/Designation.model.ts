import mongoose, { Document, Model, Schema } from "mongoose";
import { designation } from "@/types/master/designation.types";

const DesignationSchema: Schema<designation> = new Schema({
    name: { type: String, required: true, unique:true },
    department: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Department", // Reference to the Department model
                autopopulate: true
            },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

DesignationSchema.plugin(require('mongoose-autopopulate'));
const Designation: Model<designation> = mongoose.models.Designation || mongoose.model<designation>("Designation", DesignationSchema)

export default Designation
