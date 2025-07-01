import mongoose from "mongoose";

export interface BatchInfo {
    batchNumber: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Date;
    invoiceNumber: string;
    poNumber?: string;
    prNumber?: string;
}

export interface StockMovement {
    type: "in" | "out";
    quantity: number;
    date: Date;
    reference: string; // PO number, transfer reference, etc.
    remarks?: string;
    batchNumber?: string;
}

export interface inventory {
    _id?: mongoose.ObjectId;
    product: mongoose.ObjectId; // Reference to Product
    warehouse: mongoose.ObjectId; // Reference to Warehouse
    totalQuantity: number;
    batches: BatchInfo[];
    movements: StockMovement[];
    lastStockCheck: Date;
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}