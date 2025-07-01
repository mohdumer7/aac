import mongoose from "mongoose";
import { UserPersonalDetailsDocument } from "@/models/master/UserPersonalDetails.model";
import { UserEmploymentDetailsDocument } from "@/models/master/UserEmploymentDetails.model";
import { UserVisaDetailsDocument } from "@/models/master/UserVisaDetails.model";
import { UserIdentificationDocument } from "@/models/master/UserIdentification.model";
import { UserBenefitsDocument } from "@/models/master/UserBenefits.model";

export interface UserDocument {
    _id?: mongoose.Types.ObjectId;
    
    // Core user information
    empId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    displayName: string;
    email: string;
    password: string;
    imageUrl: string;
    isActive: boolean;
    
    // References to related user data categories
    personalDetails: mongoose.ObjectId | UserPersonalDetailsDocument;
    employmentDetails: mongoose.ObjectId | UserEmploymentDetailsDocument;
    visaDetails: mongoose.ObjectId | UserVisaDetailsDocument;
    identification: mongoose.ObjectId | UserIdentificationDocument;
    benefits: mongoose.ObjectId | UserBenefitsDocument;
    
    // Access and security
    access: [{
        accessId: mongoose.ObjectId;
        hasAccess: boolean;
        permissions: {
            view: boolean;
            create: boolean;
            update: boolean;
            delete: boolean;
            import: boolean;
            export: boolean;
        };
    }];
    
    // Audit fields
    addedBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}