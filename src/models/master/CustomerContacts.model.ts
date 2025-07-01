import mongoose, { Document, Model, Schema } from "mongoose";

import { customerContacts } from "@/types/master/customerContacts.types";

const CustomerContactSchema: Schema<customerContacts> = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    position: { type: String },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer", // Reference to the CustomerType model
        autopopulate: true, // Automatically populate this field
    },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })

CustomerContactSchema.plugin(require('mongoose-autopopulate'));
const CustomerContact: Model<customerContacts> = mongoose.models.CustomerContact || mongoose.model<customerContacts>("CustomerContact", CustomerContactSchema)

export default CustomerContact
