import { migrationManager } from '@/server/managers/migrationManager'

import { SUCCESS } from '@/shared/constants'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(request: NextRequest) {
  const { data } = await request.json()
  
  const result:any = await migrationManager.postEmployeeType(data)
  
  if(result.status === SUCCESS) {
    return NextResponse.json(result.data)
  }
  return NextResponse.json(result.message, { status: 500 })
}