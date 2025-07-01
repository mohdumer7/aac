import mongoose from "mongoose";

// This represents the specification requirements for a category
// e.g., { ram: "number", rom: "number", cpu: "string" }
export type SpecificationSchema = {
    [key: string]: "string" | "number" | "boolean";
}

export interface productCategory {
    _id?: mongoose.ObjectId;
    name: string;
    description?: string;
    specsRequired: SpecificationSchema; // JSON object defining required specs
    productType: mongoose.ObjectId;
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}