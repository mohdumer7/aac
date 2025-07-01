import mongoose from "mongoose";
export interface ContactPerson {
    name: string;
    designation: string;
    email: string;
    phone: string;
}

export interface vendor {
    _id?: mongoose.ObjectId;
    name: string;
    email: string;
    phone: string;
    website?: string;
    city: mongoose.ObjectId; // Reference to Location model
    contactPersons: ContactPerson[];
    isActive: boolean;
    addedBy: string;
    updatedBy: string;
}