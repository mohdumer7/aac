import mongoose, { Document, Model, Schema } from "mongoose";

import { team } from "@/types";

const TeamSchema: Schema<team> = new Schema({
    name: { type: String, required: true, unique: true },
    teamHead: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    }],
    department:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
}, { timestamps: true })

TeamSchema.plugin(require('mongoose-autopopulate'));
const Team: Model<team> = mongoose.models.Team || mongoose.model<team>("Team", TeamSchema)

export default Team
