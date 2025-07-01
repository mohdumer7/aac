import mongoose from "mongoose";
import User from "@/models/master/User.model";
import UserPersonalDetails from "@/models/master/UserPersonalDetails.model";
import UserEmploymentDetails from "@/models/master/UserEmploymentDetails.model";
import UserVisaDetails from "@/models/master/UserVisaDetails.model";
import UserIdentification from "@/models/master/UserIdentification.model";
import UserBenefits from "@/models/master/UserBenefits.model";

/**
 * Interface for user data that combines all user-related information
 */
export interface CompleteUserData {
  // Core user
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  displayName?: string;
  imageUrl?: string;
  isActive?: boolean;
  
  // Personal details
  gender?: string;
  dateOfBirth?: Date;
  maritalStatus?: string;
  nationality?: string | mongoose.Types.ObjectId;
  personalMobileNo?: string;
  
  // Employment details
  empId?: string;
  department?: string | mongoose.Types.ObjectId;
  designation?: string | mongoose.Types.ObjectId;
  reportingTo?: string | mongoose.Types.ObjectId;
  employeeType?: string | mongoose.Types.ObjectId;
  role?: string | mongoose.Types.ObjectId;
  reportingLocation?: string | mongoose.Types.ObjectId;
  activeLocation?: string | mongoose.Types.ObjectId;
  extension?: string;
  workMobile?: string;
  joiningDate?: Date;
  relievingDate?: Date;
  organisation?: string | mongoose.Types.ObjectId;
  personCode?: string;
  status?: string;
  availability?: string;
  
  // Visa details
  visaType?: string | mongoose.Types.ObjectId;
  visaIssueDate?: Date;
  visaExpiryDate?: Date;
  visaFileNo?: string;
  workPermit?: string;
  labourCardExpiryDate?: Date;
  iloeExpiryDate?: Date;
  
  // Identification
  passportNumber?: string;
  passportIssueDate?: Date;
  passportExpiryDate?: Date;
  emiratesId?: string;
  emiratesIdIssueDate?: Date;
  emiratesIdExpiryDate?: Date;
  
  // Benefits
  medicalInsurance?: string;
  medicalInsuranceStartDate?: Date;
  medicalInsuranceEndDate?: Date;
  
  // Audit
  addedBy?: string;
  updatedBy?: string;
}

/**
 * Create a new user with all related detail records
 * @param userData Complete user data 
 * @returns The created user document
 */
export async function createUserWithDetails(userData: CompleteUserData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create the core user first
    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      imageUrl: userData.imageUrl,
      isActive: userData.isActive ?? true,
      empId: userData.empId,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await user.save({ session });
    
    // Create personal details
    const personalDetails = new UserPersonalDetails({
      userId: user._id,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      maritalStatus: userData.maritalStatus,
      nationality: userData.nationality,
      personalMobileNo: userData.personalMobileNo,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await personalDetails.save({ session });
    
    // Create employment details
    const employmentDetails = new UserEmploymentDetails({
      userId: user._id,
      empId: userData.empId,
      department: userData.department,
      designation: userData.designation,
      reportingTo: userData.reportingTo,
      employeeType: userData.employeeType,
      role: userData.role,
      reportingLocation: userData.reportingLocation,
      activeLocation: userData.activeLocation,
      extension: userData.extension,
      workMobile: userData.workMobile,
      joiningDate: userData.joiningDate,
      relievingDate: userData.relievingDate,
      organisation: userData.organisation,
      personCode: userData.personCode,
      status: userData.status,
      availability: userData.availability,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await employmentDetails.save({ session });
    
    // Create visa details
    const visaDetails = new UserVisaDetails({
      userId: user._id,
      visaType: userData.visaType,
      visaIssueDate: userData.visaIssueDate,
      visaExpiryDate: userData.visaExpiryDate,
      visaFileNo: userData.visaFileNo,
      workPermit: userData.workPermit,
      labourCardExpiryDate: userData.labourCardExpiryDate,
      iloeExpiryDate: userData.iloeExpiryDate,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await visaDetails.save({ session });
    
    // Create identification
    const identification = new UserIdentification({
      userId: user._id,
      passportNumber: userData.passportNumber,
      passportIssueDate: userData.passportIssueDate,
      passportExpiryDate: userData.passportExpiryDate,
      emiratesId: userData.emiratesId,
      emiratesIdIssueDate: userData.emiratesIdIssueDate,
      emiratesIdExpiryDate: userData.emiratesIdExpiryDate,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await identification.save({ session });
    
    // Create benefits
    const benefits = new UserBenefits({
      userId: user._id,
      medicalInsurance: userData.medicalInsurance,
      medicalInsuranceStartDate: userData.medicalInsuranceStartDate,
      medicalInsuranceEndDate: userData.medicalInsuranceEndDate,
      addedBy: userData.addedBy,
      updatedBy: userData.updatedBy
    });
    
    await benefits.save({ session });
    
    // Update user with references to all created documents
    await User.findByIdAndUpdate(
      user._id,
      {
        personalDetails: personalDetails._id,
        employmentDetails: employmentDetails._id,
        visaDetails: visaDetails._id,
        identification: identification._id,
        benefits: benefits._id,
      },
      { session }
    );
    
    await session.commitTransaction();
    return user;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get a complete user with all details populated
 * @param userId The user id
 * @returns Complete user data
 */
export async function getCompleteUser(userId: string | mongoose.Types.ObjectId) {
  const user = await User.findById(userId)
    .populate('personalDetails')
    .populate('employmentDetails')
    .populate('visaDetails')
    .populate('identification')
    .populate('benefits');
  
  return user;
}

/**
 * Update a user and related details
 * @param userId User ID
 * @param userData Updated user data
 * @returns Updated user document
 */
export async function updateUserWithDetails(userId: string | mongoose.Types.ObjectId, userData: Partial<CompleteUserData>) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get the user and related documents
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update core user fields if provided
    if (userData.firstName) user.firstName = userData.firstName;
    if (userData.lastName) user.lastName = userData.lastName;
    if (userData.email) user.email = userData.email;
    if (userData.displayName) user.displayName = userData.displayName;
    if (userData.imageUrl) user.imageUrl = userData.imageUrl;
    if (userData.isActive !== undefined) user.isActive = userData.isActive;
    if (userData.empId) user.empId = userData.empId;
    if (userData.updatedBy) user.updatedBy = userData.updatedBy;
    
    await user.save({ session });
    
    // Update personal details if they exist
    if (user.personalDetails) {
      const personalDetailsFields: any = {};
      if (userData.gender) personalDetailsFields.gender = userData.gender;
      if (userData.dateOfBirth) personalDetailsFields.dateOfBirth = userData.dateOfBirth;
      if (userData.maritalStatus) personalDetailsFields.maritalStatus = userData.maritalStatus;
      if (userData.nationality) personalDetailsFields.nationality = userData.nationality;
      if (userData.personalMobileNo) personalDetailsFields.personalMobileNo = userData.personalMobileNo;
      if (userData.updatedBy) personalDetailsFields.updatedBy = userData.updatedBy;
      
      if (Object.keys(personalDetailsFields).length > 0) {
        await UserPersonalDetails.findByIdAndUpdate(user.personalDetails, personalDetailsFields, { session });
      }
    }
    
    // Update employment details if they exist
    if (user.employmentDetails) {
      const employmentDetailsFields: any = {};
      if (userData.empId) employmentDetailsFields.empId = userData.empId;
      if (userData.department) employmentDetailsFields.department = userData.department;
      if (userData.designation) employmentDetailsFields.designation = userData.designation;
      if (userData.reportingTo) employmentDetailsFields.reportingTo = userData.reportingTo;
      if (userData.employeeType) employmentDetailsFields.employeeType = userData.employeeType;
      if (userData.role) employmentDetailsFields.role = userData.role;
      if (userData.reportingLocation) employmentDetailsFields.reportingLocation = userData.reportingLocation;
      if (userData.activeLocation) employmentDetailsFields.activeLocation = userData.activeLocation;
      if (userData.extension) employmentDetailsFields.extension = userData.extension;
      if (userData.workMobile) employmentDetailsFields.workMobile = userData.workMobile;
      if (userData.joiningDate) employmentDetailsFields.joiningDate = userData.joiningDate;
      if (userData.relievingDate) employmentDetailsFields.relievingDate = userData.relievingDate;
      if (userData.organisation) employmentDetailsFields.organisation = userData.organisation;
      if (userData.personCode) employmentDetailsFields.personCode = userData.personCode;
      if (userData.status) employmentDetailsFields.status = userData.status;
      if (userData.availability) employmentDetailsFields.availability = userData.availability;
      if (userData.updatedBy) employmentDetailsFields.updatedBy = userData.updatedBy;
      
      if (Object.keys(employmentDetailsFields).length > 0) {
        await UserEmploymentDetails.findByIdAndUpdate(user.employmentDetails, employmentDetailsFields, { session });
      }
    }
    
    // Update visa details if they exist
    if (user.visaDetails) {
      const visaDetailsFields: any = {};
      if (userData.visaType) visaDetailsFields.visaType = userData.visaType;
      if (userData.visaIssueDate) visaDetailsFields.visaIssueDate = userData.visaIssueDate;
      if (userData.visaExpiryDate) visaDetailsFields.visaExpiryDate = userData.visaExpiryDate;
      if (userData.visaFileNo) visaDetailsFields.visaFileNo = userData.visaFileNo;
      if (userData.workPermit) visaDetailsFields.workPermit = userData.workPermit;
      if (userData.labourCardExpiryDate) visaDetailsFields.labourCardExpiryDate = userData.labourCardExpiryDate;
      if (userData.iloeExpiryDate) visaDetailsFields.iloeExpiryDate = userData.iloeExpiryDate;
      if (userData.updatedBy) visaDetailsFields.updatedBy = userData.updatedBy;
      
      if (Object.keys(visaDetailsFields).length > 0) {
        await UserVisaDetails.findByIdAndUpdate(user.visaDetails, visaDetailsFields, { session });
      }
    }
    
    // Update identification if it exists
    if (user.identification) {
      const identificationFields: any = {};
      if (userData.passportNumber) identificationFields.passportNumber = userData.passportNumber;
      if (userData.passportIssueDate) identificationFields.passportIssueDate = userData.passportIssueDate;
      if (userData.passportExpiryDate) identificationFields.passportExpiryDate = userData.passportExpiryDate;
      if (userData.emiratesId) identificationFields.emiratesId = userData.emiratesId;
      if (userData.emiratesIdIssueDate) identificationFields.emiratesIdIssueDate = userData.emiratesIdIssueDate;
      if (userData.emiratesIdExpiryDate) identificationFields.emiratesIdExpiryDate = userData.emiratesIdExpiryDate;
      if (userData.updatedBy) identificationFields.updatedBy = userData.updatedBy;
      
      if (Object.keys(identificationFields).length > 0) {
        await UserIdentification.findByIdAndUpdate(user.identification, identificationFields, { session });
      }
    }
    
    // Update benefits if they exist
    if (user.benefits) {
      const benefitsFields: any = {};
      if (userData.medicalInsurance) benefitsFields.medicalInsurance = userData.medicalInsurance;
      if (userData.medicalInsuranceStartDate) benefitsFields.medicalInsuranceStartDate = userData.medicalInsuranceStartDate;
      if (userData.medicalInsuranceEndDate) benefitsFields.medicalInsuranceEndDate = userData.medicalInsuranceEndDate;
      if (userData.updatedBy) benefitsFields.updatedBy = userData.updatedBy;
      
      if (Object.keys(benefitsFields).length > 0) {
        await UserBenefits.findByIdAndUpdate(user.benefits, benefitsFields, { session });
      }
    }
    
    await session.commitTransaction();
    
    // Return the complete updated user
    return getCompleteUser(userId);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
} 