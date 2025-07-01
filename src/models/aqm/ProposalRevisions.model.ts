import mongoose, { Document, Model, Schema } from "mongoose";

import { proposalRevision } from "@/types/aqm/proposalRevisions.types";

const ProposalRevisionSchema: Schema<proposalRevision> = new Schema({
    revNo:{ type: Number, default:0 },
    sentToEstimation: { type: Date, default:null },
    receivedFromEstimation: { type: Date, default:null },
    cycleTime: { type: Number, default:0 },
    sentToCustomer: { type: Date, default:null },
    notes: { type: String, default:'' },
    changes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, // Dynamic field to store changes
        default: {}
    },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

ProposalRevisionSchema.plugin(require('mongoose-autopopulate'));
const ProposalRevision: Model<proposalRevision> = mongoose.models.ProposalRevision || mongoose.model<proposalRevision>("ProposalRevision", ProposalRevisionSchema)

export default ProposalRevision
