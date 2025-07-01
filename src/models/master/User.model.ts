import mongoose, { Document, Model, Schema } from "mongoose";
import { UserDocument } from "@/types";

const UserSchema: Schema<UserDocument> = new Schema({
    // Core user information
    empId: { type: String, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    displayName: { type: String },
    email: { type: String, sparse: true },
    password: { type: String },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    
    // References to related user data categories
    personalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserPersonalDetails",
        autopopulate: true
    },
    employmentDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserEmploymentDetails",
        autopopulate: true
    },
    visaDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserVisaDetails",
        autopopulate: true
    },
    identification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserIdentification",
        autopopulate: true
    },
    benefits: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserBenefits",
        autopopulate: true
    },
    
    // Access and security
    access: [{
        accessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Access",
            autopopulate: true
        },
        hasAccess: { type: Boolean, default: false },
        permissions: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            import: { type: Boolean, default: false },
            export: { type: Boolean, default: false },
        },
        _id: false
    }],
    
    // Audit fields
    addedBy: { type: String },
    updatedBy: { type: String },
}, { 
    timestamps: true 
});

// Automatically generate fullName from firstName and lastName
UserSchema.pre('save', async function (next) {
    if (!this.fullName) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});

// Add autopopulate plugin to automatically populate referenced fields
UserSchema.plugin(require('mongoose-autopopulate'));

const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
