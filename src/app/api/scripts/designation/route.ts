// import { NextRequest, NextResponse } from 'next/server'
// import { SUCCESS, ERROR, BULK_INSERT, INSERT_ONE } from '@/shared/constants'
// import { Designation } from '@/models';
// import { dbConnect } from '@/lib/mongoose'
// import mongoose from "mongoose"

// export async function POST(request: NextRequest, response: NextResponse) {
//     try {
//         await dbConnect()
//         const { data } = await request.json()

//         if (!data) {
//             return NextResponse.json({ type: ERROR, message: "data is required", data: null }, { status: 400 })
//         }

//         const designations = data.map((item: { designation: any; }) => item.designation);
//         const distinctDesignations = [...new Set(designations)];

//         const designationDocuments = distinctDesignations.map(designation => ({
//             name: designation,
//             isActive: true,
//             createdBy: '113035',
//             updatedBy: '113035'
//         }));

//         // Insert distinct designations into the "designations" collection
//         const insertedResult = await Designation.insertMany(designationDocuments);


//         return NextResponse.json({ type: SUCCESS, message: "Distinct designations added", data: insertedResult }, { status: 200 })
//     } catch (err) {
//         // Ensure connection is closed even if error occurs
//         try {
//             await mongoose.disconnect()
//         } catch (disconnectErr) {
//             console.error("Error disconnecting:", disconnectErr)
//         }

//         console.error(err)
//         return NextResponse.json({ type: ERROR, message: err, data: null }, { status: 500 })
//     }
// }
import { migrationManager } from '@/server/managers/migrationManager'

import { SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  const { data } = await request.json()
  const result:any = await migrationManager.postDesignations(data)
  
  if(result.status === SUCCESS) {
    return NextResponse.json(result.data)
  }
  return NextResponse.json(result.message, { status: 500 })
}
