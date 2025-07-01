import mongoose, { Document, Model, Schema } from "mongoose";

import { othermaster } from "@/types/itapplications/othermaster.types";

const OtherMasterSchema: Schema<othermaster> = new Schema({
    name: { type: String, required: true, unique:true },
    department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            required: true,
            autopopulate: true
        },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

OtherMasterSchema.plugin(require('mongoose-autopopulate'));
const OtherMaster: Model<othermaster> = mongoose.models.OtherMaster || mongoose.model<othermaster>("OtherMaster", OtherMasterSchema)

export default OtherMaster
