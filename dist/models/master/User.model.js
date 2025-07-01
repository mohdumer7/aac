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
var UserSchema = new mongoose_1.Schema({
    // Core user information
    empId: { type: String, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    displayName: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // References to related user data categories
    personalDetails: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserPersonalDetails",
        autopopulate: true
    },
    employmentDetails: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserEmploymentDetails",
        autopopulate: true
    },
    visaDetails: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserVisaDetails",
        autopopulate: true
    },
    identification: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserIdentification",
        autopopulate: true
    },
    benefits: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserBenefits",
        autopopulate: true
    },
    // Access and security
    access: [{
            accessId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
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
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!this.fullName) {
                this.fullName = "".concat(this.firstName, " ").concat(this.lastName);
            }
            next();
            return [2 /*return*/];
        });
    });
});
// Add autopopulate plugin to automatically populate referenced fields
UserSchema.plugin(require('mongoose-autopopulate'));
var User = mongoose_1.default.models.User || mongoose_1.default.model("User", UserSchema);
exports.default = User;
