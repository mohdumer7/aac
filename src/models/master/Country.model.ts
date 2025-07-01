import mongoose, { Document, Model, Schema } from "mongoose";

import { country } from "@/types/master/country.types";

const CountrySchema: Schema<country> = new Schema({
    countryCode: { type: String, required: true, unique:true },
    name: { type: String, required: true, unique:true },
    region: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Region", // Reference to the Region model
            autopopulate: true
        },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })

CountrySchema.plugin(require('mongoose-autopopulate'));
const Country: Model<country> = mongoose.models.Country || mongoose.model<country>("Country", CountrySchema)

export default Country
