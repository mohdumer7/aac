import mongoose, { Document, Model, Schema } from "mongoose";

import { location } from "@/types/master/location.types";

const LocationSchema: Schema<location> = new Schema({
   
    name: { type: String, required: true, unique:true },
    address: { type: String },
    pincode: { type: String },
    state: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "State", // Reference to the State model
            autopopulate: true
        },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

LocationSchema.plugin(require('mongoose-autopopulate'));
const Location: Model<location> = mongoose.models.Location || mongoose.model<location>("Location", LocationSchema)

export default Location
