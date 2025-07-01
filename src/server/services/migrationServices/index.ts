import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { ERROR, MONGO_MODELS, SUCCESS } from '@/shared/constants';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import bcrypt from "bcryptjs";


export const postDesignations = catchAsync(async (data) => {
  if (!data) {
    return NextResponse.json({ type: ERROR, message: "data is required", data: null }, { status: 400 })
  }

  const designations = data.map((item: { designation: any; }) => item.designation);
  const distinctDesignations = [...new Set(designations)];

  const designationDocuments = distinctDesignations.map(designation => ({
    name: designation,
    isActive: true,
    createdBy: '113035',
    updatedBy: '113035'
  }));
  const result = await crudManager.mongooose.create(MONGO_MODELS.DESIGNATION_MASTER, {
    data: designationDocuments,
    bulkInsert: true
  });

  return result;
});

export const putUsers = catchAsync(async (data) => {
  // Check for required data
  if (!data) {
    return NextResponse.json({ type: ERROR, message: "data is required", data: null }, { status: 400 });
  }

  // Fetch designations from the DESIGNATION_MASTER collection
  const { status, data: designationDoc } = await crudManager.mongooose.find(MONGO_MODELS.DESIGNATION_MASTER, {});

  // If there was an error fetching the designations
  if (status !== SUCCESS) {
    return { status: ERROR, data: {} };
  }

  // Process each designation and update corresponding users
  const updateResult = await Promise.all(
    designationDoc.map(async (doc: any) => {
      try {
        const result = await crudManager.mongooose.update(MONGO_MODELS.USER_MASTER, {
          filter: { designation: doc.name },
          bulkUpdate:true,
          data: {
            $set: { designation: doc._id } 
          }
        });

        return result; // Return the result of each update operation
      } catch (error) {
        console.error(`Failed to update users for designation: ${doc.name}`, error);
        return { status: ERROR, data: { message: `Failed to update users for ${doc.name}` } };
      }
    })
  );
  return { status: SUCCESS, updateResult };
});





export const bulkDepartmentInsertSanitization = (data:any)=>{
    const departmentData = data.map((department:any) => {
        return phaseDepartmentSanitization(department)
    });
    // Log updated user data
    return departmentData
}

export const phaseDepartmentSanitization = (department:any)=>{
    return {
        depId: department.depId,
        name: department.departmentName, 
        isActive: true,
        createdBy: '113035',
        updatedBy: '113035'
    };
}

export const postRoles = catchAsync(async (data) => {
  if (!data) {
    return NextResponse.json({ type: ERROR, message: "data is required", data: null }, { status: 400 })
  }


  const roles = data.map((item: { role: any; }) => item.role);
  const distinctRoles = [...new Set(roles)];

  const roleDocuments = distinctRoles.map(role => ({
    name: role,
    isActive: true,
    createdBy: '113035',
    updatedBy: '113035'
  }));
  const result = await crudManager.mongooose.create(MONGO_MODELS.ROLE_MASTER, {
    data: roleDocuments,
    bulkInsert: true
  });

  return result;
});

export const postEmployeeType = catchAsync(async (data) => {
  if (!data) {
    return NextResponse.json({ type: ERROR, message: "data is required", data: null }, { status: 400 })
  }


  const employeeTypes = data.map((item: { employeeType: any; }) => item.employeeType);
  const distinctTypes = [...new Set(employeeTypes)];

  const typeDocuments = distinctTypes.map(employeeType => ({
    name: employeeType,
    isActive: true,
    createdBy: '113035',
    updatedBy: '113035'
  }));
  const result = await crudManager.mongooose.create(MONGO_MODELS.EMPLOYEE_TYPE_MASTER, {
    data: typeDocuments,
    bulkInsert: true
  });

  return result;
});

