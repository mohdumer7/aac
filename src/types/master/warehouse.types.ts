import mongoose from "mongoose";

export interface StorageSection {
    name: string;
    code: string;
    capacity: number;
    unit: string;
    description?: string;
}

export interface warehouse {
    _id?: mongoose.ObjectId;
    name: string;
    code: string;
    location: mongoose.ObjectId; // Reference to Location model
    contactPerson: string;
    contactNumber: string;
    storageSections: StorageSection[];
    totalCapacity: number;
    capacityUnit: string;
    operatingHours?: string;
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}