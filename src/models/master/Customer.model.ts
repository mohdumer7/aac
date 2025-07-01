import mongoose, { Document, Model, Schema } from "mongoose";

import { customer } from "@/types/master/customer.types";

const CustomerSchema: Schema<customer> = new Schema({
    name: { type: String, required: true, unique: true },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    customerType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerType", // Reference to the CustomerType model
        autopopulate: true, // Automatically populate this field
    },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String },

}, { timestamps: true })

CustomerSchema.plugin(require('mongoose-autopopulate'));
const Customer: Model<customer> = mongoose.models.Customer || mongoose.model<customer>("Customer", CustomerSchema)

export default Customer
