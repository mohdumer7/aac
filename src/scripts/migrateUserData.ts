import mongoose from "mongoose";
import User from "../models/master/User.model";
import { usersMaster } from "./data/UserData.scripts.data.";
// Import subdocument models
import UserEmploymentDetails from "../models/master/UserEmploymentDetails.model";
import UserPersonalDetails from "../models/master/UserPersonalDetails.model";
import UserVisaDetails from "../models/master/UserVisaDetails.model";
import UserIdentification from "../models/master/UserIdentification.model";
import UserBenefits from "../models/master/UserBenefits.model";

// Database connection URI from environment variable
const MONGODB_URI =  "mongodb://localhost:27017/AceroDB1?replicaSet=rs";

async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Helper to extract ObjectId string from { $oid: ... } or return as is
function extractObjectId(val: any) {
  if (val && typeof val === 'object' && val.$oid) return val.$oid;
  if (typeof val === 'string') return val;
  return undefined;
}

/**
 * Migrate user data to new schema structure
 * @param dryRun If true, performs a test migration without saving data
 * @returns Migration statistics
 */
async function migrateUserData(dryRun = false) {
  console.log(`Starting user data migration (${dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
  
  // Statistics to track the progress
  const stats = {
    total: 0,
    processed: 0,
    skipped: 0,
    successful: 0,
    failed: 0,
    errors: [] as { userId: string; error: string }[]
  };
  
  let needToDisconnect = false;
  
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
      needToDisconnect = true;
    }
    
    // Use imported user data instead of fetching from DB
    // Map usersMaster to expected field names and extract _id
    const users = usersMaster.map((u) => ({
      _id: extractObjectId(u._id),
      empId: u.empId || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      fullName: u.fullName || '',
      displayName: u.displayName || '',
      email: u.email || '',
      password: u.password || '',
      imageUrl: u.imageUrl || '',
      isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
      joiningDate: u.joiningDate && typeof u.joiningDate === 'object' && u.joiningDate !== null && (u.joiningDate as any).$date ? (u.joiningDate as any).$date : u.joiningDate || null,
      relievingDate: u.relievingDate && typeof u.relievingDate === 'object' && u.relievingDate !== null && (u.relievingDate as any).$date ? (u.relievingDate as any).$date : u.relievingDate || null,
      department: extractObjectId((u as any).department),
      designation: extractObjectId((u as any).designation),
      reportingTo: extractObjectId((u as any).reportingTo),
      employeeType: extractObjectId((u as any).employeeType),
      role: extractObjectId((u as any).role),
      reportingLocation: extractObjectId((u as any).reportingLocation),
      activeLocation: extractObjectId((u as any).activeLocation),
      extension: (u as any).extension || '',
      mobile: (u as any).mobile || '',
      organisation: extractObjectId((u as any).organisation),
      personCode: (u as any).personCode || '',
      availability: (u as any).availability || '',
      // Personal details
      gender: (u as any).gender || '',
      dateOfBirth: (u as any).dateOfBirth || '',
      maritalStatus: (u as any).maritalStatus || '',
      nationality: (u as any).nationality || '',
      personalNumber: (u as any).personalNumber || '',
      // Visa details
      visaType: extractObjectId((u as any).visaType),
      visaIssueDate: (u as any).visaIssueDate || '',
      visaExpiryDate: (u as any).visaExpiryDate || '',
      visaFileNo: (u as any).visaFileNo || '',
      workPermit: (u as any).workPermit || '',
      labourCardExpiryDate: (u as any).labourCardExpiryDate || '',
      iloeExpiryDate: (u as any).iloeExpiryDate || '',
      // Identification
      passportNumber: (u as any).passportNumber || '',
      passportIssueDate: (u as any).passportIssueDate || '',
      passportExpiryDate: (u as any).passportExpiryDate || '',
      emiratesId: (u as any).emiratesId || '',
      emiratesIdIssueDate: (u as any).emiratesIdIssueDate || '',
      emiratesIdExpiryDate: (u as any).emiratesIdExpiryDate || '',
      // Benefits
      medicalInsurance: (u as any).medicalInsurance || '',
      medicalInsuranceStartDate: (u as any).medicalInsuranceStartDate || '',
      medicalInsuranceEndDate: (u as any).medicalInsuranceEndDate || '',
      // Audit
      addedBy: (u as any).addedBy || '',
      updatedBy: (u as any).updatedBy || '',
    }));
    stats.total = users.length;
    console.log(`Found ${users.length} users to migrate`);
    
    // Process each user
    for (const oldUser of users) {
      console.log(`Processing user: ${oldUser.firstName} ${oldUser.lastName} (${oldUser._id})`);
      stats.processed++;
      try {
        if (!dryRun) {
          // Accept users even if email is empty
          await User.findByIdAndUpdate(
            oldUser._id,
            {
              $set: {
                empId: oldUser.empId,
                firstName: oldUser.firstName,
                lastName: oldUser.lastName,
                fullName: oldUser.fullName,
                displayName: oldUser.displayName,
                email: oldUser.email,
                password: oldUser.password,
                imageUrl: oldUser.imageUrl,
                isActive: oldUser.isActive,
                joiningDate: oldUser.joiningDate,
                relievingDate: oldUser.relievingDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Upsert personal details
          const personalDetailsDoc = await UserPersonalDetails.findOneAndUpdate(
            { userId: oldUser._id },
            {
              $set: {
                userId: oldUser._id,
                personalMobileNo: oldUser.personalNumber,
                dateOfBirth: oldUser.dateOfBirth,
                gender: oldUser.gender,
                maritalStatus: oldUser.maritalStatus,
                nationality: oldUser.nationality ? oldUser.nationality : undefined,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Upsert visa details
          const visaDetailsDoc = await UserVisaDetails.findOneAndUpdate(
            { userId: oldUser._id },
            {
              $set: {
                userId: oldUser._id,
                visaType: oldUser.visaType,
                visaIssueDate: oldUser.visaIssueDate,
                visaExpiryDate: oldUser.visaExpiryDate,
                visaFileNo: oldUser.visaFileNo,
                workPermit: oldUser.workPermit,
                labourCardExpiryDate: oldUser.labourCardExpiryDate,
                iloeExpiryDate: oldUser.iloeExpiryDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Upsert identification
          const identificationDoc = await UserIdentification.findOneAndUpdate(
            { userId: oldUser._id },
            {
              $set: {
                userId: oldUser._id,
                passportNumber: oldUser.passportNumber,
                passportIssueDate: oldUser.passportIssueDate,
                passportExpiryDate: oldUser.passportExpiryDate,
                emiratesId: oldUser.emiratesId,
                emiratesIdIssueDate: oldUser.emiratesIdIssueDate,
                emiratesIdExpiryDate: oldUser.emiratesIdExpiryDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Upsert benefits
          const benefitsDoc = await UserBenefits.findOneAndUpdate(
            { userId: oldUser._id },
            {
              $set: {
                userId: oldUser._id,
                medicalInsurance: oldUser.medicalInsurance,
                medicalInsuranceStartDate: oldUser.medicalInsuranceStartDate,
                medicalInsuranceEndDate: oldUser.medicalInsuranceEndDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Upsert employment details
          const employmentDetailsDoc = await UserEmploymentDetails.findOneAndUpdate(
            { userId: oldUser._id },
            {
              $set: {
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
                organisation: oldUser.organisation,
                personCode: oldUser.personCode,
                status: oldUser.isActive ? 'Active' : 'Inactive',
                availability: oldUser.availability,
                joiningDate: oldUser.joiningDate,
                relievingDate: oldUser.relievingDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
              }
            },
            { upsert: true, new: true }
          );
          // Update main user with subdocument references
          await User.findByIdAndUpdate(
            oldUser._id,
            {
              $set: {
                empId: oldUser.empId,
                firstName: oldUser.firstName,
                lastName: oldUser.lastName,
                fullName: oldUser.fullName,
                displayName: oldUser.displayName,
                email: oldUser.email,
                password: oldUser.password,
                imageUrl: oldUser.imageUrl,
                isActive: oldUser.isActive,
                joiningDate: oldUser.joiningDate,
                relievingDate: oldUser.relievingDate,
                addedBy: oldUser.addedBy,
                updatedBy: oldUser.updatedBy,
                personalDetails: personalDetailsDoc?._id,
                employmentDetails: employmentDetailsDoc?._id,
                visaDetails: visaDetailsDoc?._id,
                identification: identificationDoc?._id,
                benefits: benefitsDoc?._id,
              }
            },
            { upsert: true, new: true }
          );
        }
        console.log(`Successfully ${dryRun ? 'processed' : 'migrated'} user: ${oldUser.firstName} ${oldUser.lastName}`);
        stats.successful++;
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error";
        console.error(`Error migrating user ${oldUser._id}:`, errorMessage);
        stats.failed++;
        stats.errors.push({ userId: oldUser._id.toString(), error: errorMessage });
        // Continue with the next user if one fails
      }
    }
    
    console.log(`User data migration ${dryRun ? 'test' : 'execution'} completed`);
    console.log(`Statistics: Total: ${stats.total}, Processed: ${stats.processed}, Skipped: ${stats.skipped}, Successful: ${stats.successful}, Failed: ${stats.failed}`);
    
    return stats;
  } catch (error: any) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    if (needToDisconnect) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  }
}

// Execute the migration if this script is run directly
if (require.main === module) {
  (async () => {
    try {
      await connectToDatabase();
      const dryRun = process.argv.includes('--dry-run');
      const stats = await migrateUserData(dryRun);
      console.log(JSON.stringify(stats, null, 2));
      process.exit(0);
    } catch (error) {
      console.error("Migration script failed:", error);
      process.exit(1);
    }
  })();
}

export default migrateUserData;