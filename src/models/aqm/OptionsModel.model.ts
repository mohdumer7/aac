import mongoose, { Document, Model, Schema } from "mongoose";

import { option } from "@/types/aqm/options.types";

const OptionSchema: Schema<option> = new Schema({
    name:{type:String},
    proposals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal", // Reference to the User model  
        autopopulate: true, // Automatically populate this field
    }],

}, { timestamps: true })

OptionSchema.plugin(require('mongoose-autopopulate'));
const Option: Model<option> = mongoose.models.Option || mongoose.model<option>("Option", OptionSchema)

export default Option
