"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var User_model_1 = require("../models/master/User.model");
var UserPersonalDetails_model_1 = require("../models/master/UserPersonalDetails.model");
var UserEmploymentDetails_model_1 = require("../models/master/UserEmploymentDetails.model");
var UserVisaDetails_model_1 = require("../models/master/UserVisaDetails.model");
var UserIdentification_model_1 = require("../models/master/UserIdentification.model");
var UserBenefits_model_1 = require("../models/master/UserBenefits.model");
// Database connection URI from environment variable
var MONGODB_URI = process.env.MONGODB_URI || "";
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (mongoose_1.default.connection.readyState === 1) {
                        console.log("Already connected to MongoDB");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI)];
                case 1:
                    _a.sent();
                    console.log("Connected to MongoDB");
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to connect to MongoDB:", error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Migrate user data to new schema structure
 * @param dryRun If true, performs a test migration without saving data
 * @returns Migration statistics
 */
function migrateUserData() {
    return __awaiter(this, arguments, void 0, function (dryRun) {
        var stats, needToDisconnect, users, _i, users_1, oldUser, existingUser, personalDetails, employmentDetails, visaDetails, identification, benefits, error_2, errorMessage, error_3;
        if (dryRun === void 0) { dryRun = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting user data migration (".concat(dryRun ? 'DRY RUN' : 'LIVE MODE', ")"));
                    stats = {
                        total: 0,
                        processed: 0,
                        skipped: 0,
                        successful: 0,
                        failed: 0,
                        errors: []
                    };
                    needToDisconnect = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 18, 19, 22]);
                    if (!(mongoose_1.default.connection.readyState !== 1)) return [3 /*break*/, 3];
                    return [4 /*yield*/, connectToDatabase()];
                case 2:
                    _a.sent();
                    needToDisconnect = true;
                    _a.label = 3;
                case 3:
                    // Get all users with the old structure
                    if (!mongoose_1.default.connection.db) {
                        throw new Error("MongoDB connection is not established.");
                    }
                    return [4 /*yield*/, mongoose_1.default.connection.db.collection("users").find({}).toArray()];
                case 4:
                    users = _a.sent();
                    stats.total = users.length;
                    console.log("Found ".concat(users.length, " users to migrate"));
                    _i = 0, users_1 = users;
                    _a.label = 5;
                case 5:
                    if (!(_i < users_1.length)) return [3 /*break*/, 17];
                    oldUser = users_1[_i];
                    console.log("Processing user: ".concat(oldUser.firstName, " ").concat(oldUser.lastName, " (").concat(oldUser._id, ")"));
                    stats.processed++;
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 15, , 16]);
                    return [4 /*yield*/, User_model_1.default.findById(oldUser._id)
                            .populate('personalDetails')
                            .populate('employmentDetails')
                            .populate('visaDetails')
                            .populate('identification')
                            .populate('benefits')];
                case 7:
                    existingUser = _a.sent();
                    if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.personalDetails) ||
                        (existingUser === null || existingUser === void 0 ? void 0 : existingUser.employmentDetails) ||
                        (existingUser === null || existingUser === void 0 ? void 0 : existingUser.visaDetails) ||
                        (existingUser === null || existingUser === void 0 ? void 0 : existingUser.identification) ||
                        (existingUser === null || existingUser === void 0 ? void 0 : existingUser.benefits)) {
                        console.log("Skipping user ".concat(oldUser._id, ": already has related records"));
                        stats.skipped++;
                        return [3 /*break*/, 16];
                    }
                    if (!!dryRun) return [3 /*break*/, 14];
                    personalDetails = new UserPersonalDetails_model_1.default({
                        userId: oldUser._id,
                        gender: oldUser.gender,
                        dateOfBirth: oldUser.dateOfBirth,
                        maritalStatus: oldUser.maritalStatus,
                        nationality: oldUser.nationality,
                        personalMobileNo: oldUser.personalNumber,
                        addedBy: oldUser.addedBy,
                        updatedBy: oldUser.updatedBy
                    });
                    return [4 /*yield*/, personalDetails.save()];
                case 8:
                    _a.sent();
                    employmentDetails = new UserEmploymentDetails_model_1.default({
                        userId: oldUser._id,
                        empId: oldUser.empId,
                        department: oldUser.department,
                        designation: oldUser.designation,
                        reportingTo: oldUser.reportingTo,
                        employeeType: oldUser.employeeType,
                        role: oldUser.role,
                        reportingLocation: oldUser.reportingLocation,
                        activeLocation: oldUser.activeLocation,
                        extension: oldUser.extension,
                        workMobile: oldUser.mobile,
                        joiningDate: oldUser.joiningDate,
                        relievingDate: oldUser.relievingDate,
                        organisation: oldUser.organisation,
                        personCode: oldUser.personCode,
                        status: oldUser.status,
                        availability: oldUser.availability,
                        addedBy: oldUser.addedBy,
                        updatedBy: oldUser.updatedBy
                    });
                    return [4 /*yield*/, employmentDetails.save()];
                case 9:
                    _a.sent();
                    visaDetails = new UserVisaDetails_model_1.default({
                        userId: oldUser._id,
                        visaType: oldUser.visaType,
                        visaIssueDate: oldUser.visaIssueDate,
                        visaExpiryDate: oldUser.visaExpiryDate,
                        visaFileNo: oldUser.visaFileNo,
                        workPermit: oldUser.workPermit,
                        labourCardExpiryDate: oldUser.labourCardExpiryDate,
                        iloeExpiryDate: oldUser.iloeExpiryDate,
                        addedBy: oldUser.addedBy,
                        updatedBy: oldUser.updatedBy
                    });
                    return [4 /*yield*/, visaDetails.save()];
                case 10:
                    _a.sent();
                    identification = new UserIdentification_model_1.default({
                        userId: oldUser._id,
                        passportNumber: oldUser.passportNumber,
                        passportIssueDate: oldUser.passportIssueDate,
                        passportExpiryDate: oldUser.passportExpiryDate,
                        emiratesId: oldUser.emiratesId,
                        emiratesIdIssueDate: oldUser.emiratesIdIssueDate,
                        emiratesIdExpiryDate: oldUser.emiratesIdExpiryDate,
                        addedBy: oldUser.addedBy,
                        updatedBy: oldUser.updatedBy
                    });
                    return [4 /*yield*/, identification.save()];
                case 11:
                    _a.sent();
                    benefits = new UserBenefits_model_1.default({
                        userId: oldUser._id,
                        medicalInsurance: oldUser.medicalInsurance,
                        addedBy: oldUser.addedBy,
                        updatedBy: oldUser.updatedBy
                    });
                    return [4 /*yield*/, benefits.save()];
                case 12:
                    _a.sent();
                    // 6. Update User record to include references to the new records
                    return [4 /*yield*/, User_model_1.default.findByIdAndUpdate(oldUser._id, {
                            personalDetails: personalDetails._id,
                            employmentDetails: employmentDetails._id,
                            visaDetails: visaDetails._id,
                            identification: identification._id,
                            benefits: benefits._id,
                            empId: oldUser.empId,
                            // Keep the existing data for core user fields
                        })];
                case 13:
                    // 6. Update User record to include references to the new records
                    _a.sent();
                    _a.label = 14;
                case 14:
                    console.log("Successfully ".concat(dryRun ? 'processed' : 'migrated', " user: ").concat(oldUser.firstName, " ").concat(oldUser.lastName));
                    stats.successful++;
                    return [3 /*break*/, 16];
                case 15:
                    error_2 = _a.sent();
                    errorMessage = error_2.message || "Unknown error";
                    console.error("Error migrating user ".concat(oldUser._id, ":"), errorMessage);
                    stats.failed++;
                    stats.errors.push({ userId: oldUser._id.toString(), error: errorMessage });
                    return [3 /*break*/, 16];
                case 16:
                    _i++;
                    return [3 /*break*/, 5];
                case 17:
                    console.log("User data migration ".concat(dryRun ? 'test' : 'execution', " completed"));
                    console.log("Statistics: Total: ".concat(stats.total, ", Processed: ").concat(stats.processed, ", Skipped: ").concat(stats.skipped, ", Successful: ").concat(stats.successful, ", Failed: ").concat(stats.failed));
                    return [2 /*return*/, stats];
                case 18:
                    error_3 = _a.sent();
                    console.error("Migration failed:", error_3);
                    throw error_3;
                case 19:
                    if (!needToDisconnect) return [3 /*break*/, 21];
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 20:
                    _a.sent();
                    console.log("Disconnected from MongoDB");
                    _a.label = 21;
                case 21: return [7 /*endfinally*/];
                case 22: return [2 /*return*/];
            }
        });
    });
}
// Execute the migration if this script is run directly
if (require.main === module) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var dryRun, stats, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, connectToDatabase()];
                case 1:
                    _a.sent();
                    dryRun = process.argv.includes('--dry-run');
                    return [4 /*yield*/, migrateUserData(dryRun)];
                case 2:
                    stats = _a.sent();
                    console.log(JSON.stringify(stats, null, 2));
                    process.exit(0);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error("Migration script failed:", error_4);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); })();
}
exports.default = migrateUserData;
