import { dbConnect } from '@/lib/mongoose';
import { Designation, User } from '@/models';
import { migrationManager } from '@/server/managers/migrationManager'

import { ERROR, SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  // const { data } = await request.json()
  await dbConnect();


  try {
    // Find all unique string designations in User collection
    // const usersWithStringDesignation = await User.find({
    //   designation: { $type: "string" },
    // });

    // Extract unique designations
    // const designations = [
    //   ...new Set(usersWithStringDesignation.map((user) => user.designation)),
    // ];

    // Fetch corresponding ObjectIDs from Master model
    // const masters = await Designation.find({ name: { $in: designations } });
    const masters = await Designation.find();
    
    for (const master of masters) {
      // Update all users with matching string designation


      const result = await User.updateMany(
        { designation1: master.name }, // Match current string value
        { $set: { designation: master._id } }   // Set ObjectId
      );

      
    }

    return NextResponse.json({ message: "Users updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
