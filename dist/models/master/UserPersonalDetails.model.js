"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserPersonalDetailsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },
    dateOfBirth: { type: Date },
    maritalStatus: {
        type: String,
        enum: ["Single", "Married", "Divorced", "Widowed"]
    },
    nationality: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Country",
        autopopulate: true
    },
    personalMobileNo: { type: String },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
// Add autopopulate plugin to automatically populate referenced fields
UserPersonalDetailsSchema.plugin(require('mongoose-autopopulate'));
var UserPersonalDetails = mongoose_1.default.models.UserPersonalDetails ||
    mongoose_1.default.model("UserPersonalDetails", UserPersonalDetailsSchema);
exports.default = UserPersonalDetails;
