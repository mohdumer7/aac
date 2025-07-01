import { dbConnect } from '@/lib/mongoose'
import { NextRequest, NextResponse } from 'next/server'
import {User} from "@/models/index"
import mongoose from "mongoose"
import { bulkUserInsertSanitization, phaseUserSanitization } from '@/scripts/User.script'
import { SUCCESS, ERROR, BULK_INSERT, INSERT_ONE } from '@/shared/constants'
import { userManager } from '@/server/managers/userManager'


export async function GET() {
    try {
        const users = await userManager.getUsers();
       
        return NextResponse.json({data:users})

    } catch(err) {
        console.error(err)
        return NextResponse.json({type: ERROR,message:err,data: null}, { status: 500 })
    }
}


export async function POST(request:NextRequest) {
    try {
        await dbConnect()
        const {action,encryptPassword,data} = await request.json()
     
     
        if(!action || !data) {
            return NextResponse.json({type: ERROR,message: "Action and data is required",data: null}, { status: 400 })
        };
        
        const iEncryptPassword = encryptPassword ? true : false
        let response;

        switch(action) {
           
            case BULK_INSERT:
                
                response = await User.insertMany(bulkUserInsertSanitization(data,iEncryptPassword))
                return NextResponse.json({type: SUCCESS,message: "Bulk insert success",data: response}, { status: 200 })
            case INSERT_ONE:
                response = await User.create(phaseUserSanitization(data,iEncryptPassword))
                return NextResponse.json({type: SUCCESS,message: "Insert one success",data: response}, { status: 200 })
            default:
                response = await User.insertMany(bulkUserInsertSanitization(data,iEncryptPassword))
                return NextResponse.json({type: SUCCESS,message: "Bulk insert success",data: response}, { status: 200 })

        }

    } catch(err) {
        // Ensure connection is closed even if error occurs
        try {
            await mongoose.disconnect()
        } catch (disconnectErr) {
            console.error("Error disconnecting:", disconnectErr)
        }

        console.error(err)
        return NextResponse.json({type: ERROR,message:err,data: null}, { status: 500 })
    }
}
