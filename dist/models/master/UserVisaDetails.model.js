"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserVisaDetailsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    visaType: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "VisaType",
        autopopulate: true
    },
    visaIssueDate: { type: Date },
    visaExpiryDate: { type: Date },
    visaFileNo: { type: String },
    workPermit: { type: String },
    labourCardExpiryDate: { type: Date },
    iloeExpiryDate: { type: Date },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
// Add autopopulate plugin to automatically populate referenced fields
UserVisaDetailsSchema.plugin(require('mongoose-autopopulate'));
var UserVisaDetails = mongoose_1.default.models.UserVisaDetails ||
    mongoose_1.default.model("UserVisaDetails", UserVisaDetailsSchema);
exports.default = UserVisaDetails;
