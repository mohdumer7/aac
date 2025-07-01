import mongoose, { Model, Schema } from "mongoose";
import { vendor, ContactPerson } from "@/types/master/vendor.types";

const ContactPersonSchema = new Schema<ContactPerson>({
    name: { type: String },
    designation: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false }
}, { _id: false });


const VendorSchema: Schema<vendor> = new Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "State",
        
        autopopulate: true
    },
    contactPersons: [ContactPersonSchema],
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });

VendorSchema.plugin(require('mongoose-autopopulate'));
const Vendor: Model<vendor> = mongoose.models.Vendor || mongoose.model<vendor>("Vendor", VendorSchema);

export default Vendor;