import mongoose, { Document, Model, Schema } from "mongoose";

import { jobaccount } from "@/types/itapplications/jobaccount.types";

const JobAccountSchema: Schema<jobaccount> = new Schema({
    name: { type: String, required: true, unique: true },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference
        autopopulate: true
    },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })


JobAccountSchema.plugin(require('mongoose-autopopulate'));
const JobAccount: Model<jobaccount> = mongoose.models.JobAccount || mongoose.model<jobaccount>("JobAccount", JobAccountSchema)

export default JobAccount
