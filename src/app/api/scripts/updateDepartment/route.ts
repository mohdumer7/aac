import { dbConnect } from '@/lib/mongoose';
import { Department, Designation, User } from '@/models';
import { migrationManager } from '@/server/managers/migrationManager'

import { ERROR, SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  // const { data } = await request.json()
  await dbConnect();

  try {
  
    const masters = await Department.find();
    console.log(masters);
    for (const master of masters) {
      // Update all users with matching string department


      const result = await User.updateMany(
        { department1: master.depId }, // Match current string value
        { $set: { department: master._id } }   // Set ObjectId
      );

      
    }

    return NextResponse.json({ message: "Users updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
