"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserEmploymentDetailsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    empId: { type: String, unique: true },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department",
        autopopulate: true
    },
    designation: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Designation",
        autopopulate: true
    },
    reportingTo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        autopopulate: {
            select: "firstName lastName displayName email"
        }
    },
    employeeType: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "EmployeeType",
        autopopulate: true
    },
    role: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Role",
        autopopulate: true
    },
    reportingLocation: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Location",
        autopopulate: true
    },
    activeLocation: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Location",
        autopopulate: true
    },
    extension: { type: String },
    workMobile: { type: String },
    joiningDate: { type: Date },
    relievingDate: { type: Date },
    organisation: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Organisation",
        autopopulate: true
    },
    personCode: { type: String },
    status: {
        type: String,
        enum: ["Active", "On Leave", "Terminated", "Resigned"],
        default: "Active"
    },
    availability: {
        type: String,
        enum: ["Available", "Busy", "Away", "In Meeting", "On Leave"],
        default: "Available"
    },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });
// Add autopopulate plugin to automatically populate referenced fields
UserEmploymentDetailsSchema.plugin(require('mongoose-autopopulate'));
var UserEmploymentDetails = mongoose_1.default.models.UserEmploymentDetails ||
    mongoose_1.default.model("UserEmploymentDetails", UserEmploymentDetailsSchema);
exports.default = UserEmploymentDetails;
