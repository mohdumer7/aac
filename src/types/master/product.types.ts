import mongoose from "mongoose";

// This stores the actual values for the specifications
// e.g., { ram: "16GB", rom: "512GB", cpu: "Intel i7" }
export type SpecificationValues = {
    [key: string]: string | number | boolean;
}

export interface product {
    _id?: mongoose.ObjectId;
    name: string;
    category: mongoose.ObjectId; // Reference to ProductCategory
    brand: string;
    model: string;
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}