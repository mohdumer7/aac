import { userManager } from '@/server/managers/userManager'
import { ERROR, INVALID_REQUEST, SUCCESS, ACCESS_ID_REQUIRED, INSUFFIENT_DATA, BODY_REQUIRED, SPECIFY_ACTION } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request:NextRequest) {
  const filter= {}
  const searchParams = new URL(request.url).searchParams;
  searchParams.forEach((value: string, key: string) => {
    (filter as any)[key] = value;
  });


  const response: any = await userManager.getUsers({ filter });

  if (response.status === SUCCESS) {
    return NextResponse.json({status:SUCCESS, message:SUCCESS, data:response.data}, { status: 200 })
  }

  return NextResponse.json({status:ERROR, message:response.message, data:{}}, { status: 500 })
}

//NextResponse.json({status:ERROR, message:ACCESS_ID_REQUIRED, data:{}}, { status: 400 })
//NextResponse.json({status:SUCCESS, message:SUCCESS, data:response.data}, { status: 200 })

export async function POST(request:NextRequest) {
  const body = await request.json()
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET})
  if(!body) return NextResponse.json({status:ERROR, message:BODY_REQUIRED,data:{}}, { status: 400 })

  let response:any = {};
  switch(body.action){
    case 'create':
      response = await userManager.createUser(body)
    
      break;
    case 'update':
      // Expect filter and data fields for update
      if (!body.filter || !body.data) {
        return NextResponse.json({status:ERROR, message:INSUFFIENT_DATA, data:{}}, { status: 400 })
      }
      response = await userManager.updateUser(body)
      break;
    case 'updateAccess':
      if(!body.data.id) {
        return NextResponse.json({status:ERROR, message:ACCESS_ID_REQUIRED, data:{}}, { status: 400 })
      }
      response = await userManager.updateAccess(body)
      break;
    default:
      return NextResponse.json({status:ERROR, message:SPECIFY_ACTION, data:{}}, { status: 400 })
  }
  
  if(response.status === SUCCESS) {
    return NextResponse.json({status:SUCCESS, message:SUCCESS, data:response.data}, { status: 200 })
  }
  return NextResponse.json({status:ERROR, message:response.message, data:{}}, { status: 500 })

}


export async function PUT(request:NextRequest) {
  const body = await request.json()
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET})

  let response:any = {}
  
  if(!body) return NextResponse.json({status:ERROR, message:BODY_REQUIRED,data:{}}, { status: 400 })
  if(!body.data.id) {
    return NextResponse.json({status:ERROR, message:ACCESS_ID_REQUIRED, data:{}}, { status: 400 })
  }
  response = await userManager.updateAccess(body)
  
  if(response.status === SUCCESS) {
    return NextResponse.json({status:SUCCESS, message:SUCCESS, data:response.data}, { status: 200 })
  }
  return NextResponse.json({status:ERROR, message:response.message, data:{}}, { status: 500 })

}

