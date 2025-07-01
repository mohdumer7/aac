"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserBenefitsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    medicalInsurance: { type: String },
    medicalInsuranceStartDate: { type: Date },
    medicalInsuranceEndDate: { type: Date },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
// Add autopopulate plugin to automatically populate referenced fields
UserBenefitsSchema.plugin(require('mongoose-autopopulate'));
var UserBenefits = mongoose_1.default.models.UserBenefits ||
    mongoose_1.default.model("UserBenefits", UserBenefitsSchema);
exports.default = UserBenefits;
