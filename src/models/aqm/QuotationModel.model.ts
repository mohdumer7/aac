import mongoose, { Document, Model, Schema } from "mongoose";

import { quotation } from "@/types/aqm/quotation.types";

const QuotationSchema: Schema<quotation> = new Schema({
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    },
    year: { type: Number, required: true },
    option: { type: String, required: true },
    proposals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    }],
    revNo: { type: Number, required: true },
    quoteNo: { type: Number, default:null },
    quoteStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuoteStatus", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    },
    salesEngineer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    },
    salesSupportEngineer: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember", // Reference to the User model
        required: true,
        autopopulate: true, // Automatically populate this field
    }],
    rcvdDateFromCustomer: { type: Date, required: true },
    sellingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    responsibleTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team", // Reference to the User model
        required: true,
        autopopulate: true, // Automatically populate this field
    },
    quoteDetailsRemark: { type: String, default: '' },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerContact", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    customerType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerType", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    customerDetailsRemark: { type: String, default: '' },
    projectName: { type: String, default: '' },
    sector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sector", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    industryType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IndustryType", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    otherIndustryType: { type: String, default: '' },
    buildingType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BuildingType", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    otherBuildingType: { type: String, default: '' },
    buildingUsage: { type: String, default: '' },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "State", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    approvalAuthority: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApprovalAuthority", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    plotNumber: { type: String, default: '' },
    endClient: { type: String, default: '' },
    projectManagementOffice: { type: String, default: '' },
    consultant: { type: String, default: '' },
    mainContractor: { type: String, default: '' },
    erector: { type: String, default: '' },
    projectDetailsRemark: { type: String, default: '' },

    noOfBuilding: { type: Number },
    projectType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectType", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    paintType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaintType", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    otherPaintType: { type: String, default: '' },
    projectArea: { type: Number, },
    totalWt: { type: Number, },
    mezzanineArea: { type: Number, },
    mezzanineWt: { type: Number, },
    technicalDetailsRemark: { type: String, default: '' },
    currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Currency", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    totalEstPrice: { type: Number, },
    q22Value: { type: Number, },
    spBuyoutPrice: { type: Number, },
    freightPrice: { type: Number, },
    incoterm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incoterm", // Reference to the User model

        autopopulate: true, // Automatically populate this field
    },
    incotermDescription: { type: String, default: '' },
    bookingProbability: { type: String, default: '' },
    commercialDetailsRemark: { type: String, default: '' },
    jobNo: { type: String, default: '' },
    jobDate: { type: Date, default: null },
    forecastMonth: { type: Number },
    paymentTerm: { type: String, default: '' },
    remarks: { type: String, default: '' },
    lostTo: { type: String, default: '' },
    lostToOthers: { type: String, default: '' },
    reason: { type: String, default: '' },
    lostDate: { type: Date, default: null },
    initialShipDate: { type: Date, default: null },
    finalShipDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    handleBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember", // Reference to the User model
        autopopulate: true, // Automatically populate this field
    },
    status: {
        type: String,
        enum: ['draft', 'quoterequested', 'incomplete', 'submitted', 'rejected', 'approved'], // Enum values for the status
        required: true
    },
    submitDate: { type: Date, default: null },
    approvalDate: { type: Date },
    rejectReason: { type: String },
    rejectedDate: { type: Date },
    addedBy: { type: String },
    updatedBy: { type: String },


}, { timestamps: true })

QuotationSchema.plugin(require('mongoose-autopopulate'));
const Quotation: Model<quotation> = mongoose.models.Quotation || mongoose.model<quotation>("Quotation", QuotationSchema)

export default Quotation
