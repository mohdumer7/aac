import bcrypt from "bcryptjs";

export const bulkUserInsertSanitization = (data:any,iEencryptPasswword:boolean)=>{
    const updatedUserData = data.map((user:any) => {
        return phaseUserSanitization(user,iEencryptPasswword)
    });
    // Log updated user data
    return updatedUserData
}

export const phaseUserSanitization = (user:any,iEncryptPassword:boolean)=>{
    return {
        empId: user.userid, 
        firstName: user.firstname, 
        lastName: user.lastname,
        email: user.email,
        password: iEncryptPassword && user.password ? bcrypt.hashSync(user.password, 10) : (user.password || ""), // Encrypt if flag true and password exists
        role1: user.role, // Role
        displayName: user.displayName || "", // Optional Display Name
        fullName: user.fullname, // Full name
        designation1: user.designation, // Designation
        employeeType1: user.employeeType, // Employee type
        department1: user.depid || "", // Department ID
        location: user.location, // Location
        reportingTo: user.reportingtoid || "", // Reporting To ID
        isActive: user.Status === "Active", // Boolean conversion for isActive
        status: user.status, // Status
        availability: user.Availability ? "Available" : "Unavailable", // String conversion for availability
        extension: user.Extension || "", // Extension
        mobile: user.Mobile || "", // Mobile
        joiningDate: new Date(user?.joiningdate?.date || new Date()), // Joining date conversion
        relievingDate: null, // Default to null (no value in old data)
        addedBy: user.reportingtoid,
        updatedBy: user.reportingtoid,
       
        
    };
}

