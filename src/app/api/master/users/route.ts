import { masterdataManager } from '@/server/managers/masterDataManager'
import { SUCCESS } from '@/shared/constants'
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
  try {
    // Ensure database connection and models are initialized
    await dbConnect()

    const searchParams = new URL(request.url).searchParams;
    
    // Extract and parse the filter parameter
    const filterParam = searchParams.get('filter');
    let filter = {};
    if (filterParam) {
      try {
        filter = JSON.parse(filterParam);
      } catch (error) {
        return NextResponse.json(
          { status: 'ERROR', message: 'INVALID_FILTER_FORMAT', data: {} },
          { status: 400 }
        );
      }
    }

    // Extract and parse the sort parameter
    const sortParam = searchParams.get('sort');
    let sort = {};
    if (sortParam) {
      try {
        sort = JSON.parse(sortParam);
      } catch (error) {
        return NextResponse.json(
          { status: 'ERROR', message: 'INVALID_SORT_FORMAT', data: {} },
          { status: 400 }
        );
      }
    }

    // Extract and parse the populate parameter
    const populateParam = searchParams.get('populate');
    let populate = [];
    if (populateParam) {
      try {
        populate = JSON.parse(populateParam);
      } catch (error) {
        return NextResponse.json(
          { status: 'ERROR', message: 'INVALID_POPULATE_FORMAT', data: {} },
          { status: 400 }
        );
      }
    }

    // Default filter to only active users
    const finalFilter = { isActive: true, ...filter };
    const operations = { filter: finalFilter, sort, populate };

    const response = await masterdataManager.getMasterData({ 
      db: 'USER_MASTER', 
      operations 
    });

    if (response.status === SUCCESS) {
      return NextResponse.json({ 
        status: SUCCESS, 
        message: SUCCESS, 
        data: response.data 
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'INTERNAL_SERVER_ERROR', data: {} },
      { status: 500 }
    );
  }
}