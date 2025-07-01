import { dbConnect } from '@/lib/mongoose';
import { Department, Designation, User } from '@/models';
import { migrationManager } from '@/server/managers/migrationManager'

import { ERROR, SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  // const { data } = await request.json()
  await dbConnect();

  try {
    const body = await request.json()
   
    for (const user of body?.data) {
      // Update all users with matching string department
     
      const reporting = await User.find({ empId: user?.reportingtoid });
      
     if (reporting.length > 0) {
      const result = await User.updateOne(
        { empId: user.userid }, // Match current string value
        { $set: { reportingTo: reporting[0]._id.toString() } }   // Set ObjectId
      );

    }
}

    return NextResponse.json({ message: "Users updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
