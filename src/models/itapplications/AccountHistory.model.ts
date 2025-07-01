import mongoose, { Document, Model, Schema } from "mongoose";

import { accounthistory } from "@/types/itapplications/accounthistory.types";

const AccountHistorySchema: Schema<accounthistory> = new Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountMaster", // Reference
        autopopulate: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference
        autopopulate: true
    },
    others: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OtherMaster", // Reference
        autopopulate: true
    },
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PackageMaster", // Reference
        autopopulate: true
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    addedBy: { type: String },
    updatedBy: { type: String }

}, { timestamps: true })


AccountHistorySchema.plugin(require('mongoose-autopopulate'));
const AccountHistory: Model<accounthistory> = mongoose.models.AccountHistory || mongoose.model<accounthistory>("AccountHistory", AccountHistorySchema)

export default AccountHistory
