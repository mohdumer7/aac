import { dbConnect } from '@/lib/mongoose';
import { Department, Designation, EmployeeType, Role, User } from '@/models';
import { migrationManager } from '@/server/managers/migrationManager'

import { ERROR, SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  // const { data } = await request.json()
  await dbConnect();

  try {
    
    const masters = await EmployeeType.find();
    
    for (const master of masters) {
      // Update all users with matching string department


      const result = await User.updateMany(
        { employeeType1: master.name }, // Match current string value
        { $set: { employeeType: master._id } }   // Set ObjectId
      );

      
    }

    return NextResponse.json({ message: "Users updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
