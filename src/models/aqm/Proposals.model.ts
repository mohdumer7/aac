import mongoose, { Document, Model, Schema } from "mongoose";

import { proposal } from "@/types/aqm/proposals.types";

const ProposalSchema: Schema<proposal> = new Schema({
    revisions:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProposalRevision",
            autopopulate: true, // Automatically populate this field
        }],
    type: { type: String, required:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

ProposalSchema.plugin(require('mongoose-autopopulate'));
const Proposal: Model<proposal> = mongoose.models.Proposal || mongoose.model<proposal>("Proposal", ProposalSchema)

export default Proposal
