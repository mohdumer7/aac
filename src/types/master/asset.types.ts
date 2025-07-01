import mongoose from "mongoose";

export type AssetStatus = "in-stock" | "assigned" | "under-repair" | "disposed" | "in-transit";

export interface ServiceRecord {
    date: Date;
    type: string;
    description: string;
    cost?: number;
    vendor: mongoose.ObjectId; // Reference to Vendor who performed service
    nextServiceDue?: Date;
    attachments?: string[]; // URLs to service documents
}

export interface AssignmentRecord {
    assignedTo: mongoose.ObjectId; // Reference to User
    assignedBy: mongoose.ObjectId; // Reference to User
    assignedDate: Date;
    returnDate?: Date;
    location: mongoose.ObjectId; // Reference to Location
    department?: mongoose.ObjectId; // Reference to Department
    remarks?: string;
}

export interface asset {
    _id?: mongoose.ObjectId;
    product: mongoose.ObjectId; // Reference to Product
    serialNumber: string;
    status: AssetStatus;
    purchaseInfo: {
        date: Date;
        cost: number;
        poNumber: string;
        prNumber?: string;
        invoiceNumber: string;
        vendor: mongoose.ObjectId; // Reference to Vendor
    };
    warranty: {
        startDate: Date;
        endDate: Date;
        type: string;
        description?: string;
    };
    currentAssignment?: AssignmentRecord;
    assignmentHistory: AssignmentRecord[];
    serviceHistory: ServiceRecord[];
    currentLocation: mongoose.ObjectId; // Reference to Location
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}