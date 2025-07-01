import mongoose, { Document, Model, Schema } from "mongoose";

import { state } from "@/types/master/state.types";

const StateSchema: Schema<state> = new Schema({
    name: { type: String, required: true, unique:true },
    country: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Country", // Reference to the Region model
            autopopulate: true
        },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

StateSchema.plugin(require('mongoose-autopopulate'));
const State: Model<state> = mongoose.models.State || mongoose.model<state>("State", StateSchema)

export default State
