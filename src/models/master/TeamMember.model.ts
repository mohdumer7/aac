import mongoose, { Document, Model, Schema } from "mongoose";

import { teamMember } from "@/types";

const TeamMemberSchema: Schema<teamMember> = new Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // based on department
        required: true, // Make this field required
        unique: true, // Make this field unique
        autopopulate: true, // Automatically populate this field
    },
    teamRole:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamRole",
        autopopulate: true, // Automatically populate this field
    }],
    teamReportingTo:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        autopopulate: true, // Automatically populate this field
    }],
    team:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        autopopulate: true, // Automatically populate this field
    },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })

TeamMemberSchema.plugin(require('mongoose-autopopulate'));
const TeamMember: Model<teamMember> = mongoose.models.TeamMember || mongoose.model<teamMember>("TeamMember", TeamMemberSchema)

export default TeamMember
