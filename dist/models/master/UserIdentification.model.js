"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserIdentificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    passportNumber: { type: String },
    passportIssueDate: { type: Date },
    passportExpiryDate: { type: Date },
    emiratesId: { type: String },
    emiratesIdIssueDate: { type: Date },
    emiratesIdExpiryDate: { type: Date },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
// Add autopopulate plugin to automatically populate referenced fields
UserIdentificationSchema.plugin(require('mongoose-autopopulate'));
var UserIdentification = mongoose_1.default.models.UserIdentification ||
    mongoose_1.default.model("UserIdentification", UserIdentificationSchema);
exports.default = UserIdentification;
