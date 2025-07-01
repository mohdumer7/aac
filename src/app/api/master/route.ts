import { masterdataManager } from '@/server/managers/masterDataManager'
import { BODY_REQUIRED, DB_REQUIRED, ERROR, INSUFFIENT_DATA, INVALID_REQUEST, SUCCESS } from '@/shared/constants'
import { createMongooseObjectId, isObjectEmpty } from '@/shared/functions'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { dbConnect } from '@/lib/mongoose'
import * as models from '@/models'
import mongoose from 'mongoose'

// Initialize models
Object.values(models).forEach(model => {
  const modelName = (model as any).modelName
  if (modelName && !mongoose.models[modelName]) {
    ; (model as any).init()
  }
})

export async function GET(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect()

  const searchParams = new URL(request.url).searchParams;
  const operations: any = {};

  // Extract the database name
  const db = searchParams.get('db');
  if (!db) {
    return NextResponse.json(
      { status: 'ERROR', message: 'DB_REQUIRED', data: {} },
      { status: 400 }
    );
  }

  // Extract and parse the filter parameter
  const filterParam = searchParams.get('filter');
  if (filterParam) {
    try {
      operations.filter = JSON.parse(filterParam);
    } catch (error) {
      return NextResponse.json(
        { status: 'ERROR', message: 'INVALID_FILTER_FORMAT', data: {} },
        { status: 400 }
      );
    }
  } else {
    operations.filter = {};
  }

  // Extract and parse the sort parameter
  const sortParam = searchParams.get('sort');
  if (sortParam) {
    try {
      operations.sort = JSON.parse(sortParam);
    } catch (error) {
      return NextResponse.json(
        { status: 'ERROR', message: 'INVALID_SORT_FORMAT', data: {} },
        { status: 400 }
      );
    }
  }

  // Populate Parameter
  const populateParam = searchParams.get('populate');
  if (populateParam) {
    try {
      operations.populate = JSON.parse(populateParam);
    } catch (error) {
      return NextResponse.json(
        { status: 'ERROR', message: 'INVALID_POPULATE_FORMAT', data: {} },
        { status: 400 }
      );
    }
  }

  const response: any = await masterdataManager.getMasterData({ db, operations })

  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 })
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect()

  const body = await request.json()

  if (!body) return NextResponse.json({ status: ERROR, message: INVALID_REQUEST, data: {} }, { status: 400 })

  const { db, action, data } = body

  if (!db || !action) return NextResponse.json({ status: ERROR, message: INSUFFIENT_DATA, data: {} }, { status: 400 })


  body.data.addedBy = createMongooseObjectId(body.addedBy)
  body.data.updatedBy = createMongooseObjectId(body.updatedBy)

  let response: any = {}

  switch (action) {
    case "create":
      response = await masterdataManager.createMasterData(body)
      break;
    case "update":
      response = await masterdataManager.updateMasterData(body)
      break;
    default:
      response = { status: ERROR, message: INVALID_REQUEST }
  }


  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 })
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 })
}
