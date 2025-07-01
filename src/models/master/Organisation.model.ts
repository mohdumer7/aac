import mongoose, { Document, Model, Schema } from "mongoose";
import { organisation } from "@/types/master/organisation.types";

const OrganisationSchema: Schema<organisation> = new Schema({
    name: { type: String, required: true },
    location: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Location", // Reference to the Continent model
                autopopulate: true
            },
    isActive: { type: Boolean, required: true },
    addedBy: { type: String, required: true },
    updatedBy: { type: String, required: true }
}, { timestamps: true,strictPopulate:false });


OrganisationSchema.plugin(require('mongoose-autopopulate'));

const Organisation: Model<organisation> = mongoose.models.Organisation || mongoose.model<organisation>("Organisation", OrganisationSchema);

export default Organisation;
