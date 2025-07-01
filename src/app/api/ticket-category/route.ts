// src/app/api/ticket-category/route.ts
import { ticketCategoryManager } from '@/server/managers/ticketCategoryManager';
import { BODY_REQUIRED, ERROR, INSUFFIENT_DATA, INVALID_REQUEST, SUCCESS } from '@/shared/constants';
import { createMongooseObjectId } from '@/shared/functions';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import * as models from '@/models';
import mongoose from 'mongoose';

// Initialize models
Object.values(models).forEach(model => {
  const modelName = (model as any).modelName;
  if (modelName && !mongoose.models[modelName]) {
    ;(model as any).init();
  }
});

export async function GET(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect();

  const searchParams = new URL(request.url).searchParams;
  const operations: any = {};

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

  // Get specific category by ID
  const id = searchParams.get('id');
  if (id) {
    const response = await ticketCategoryManager.getTicketCategoryById(id);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 404 }
    );
  }

  // Get categories by department
  const departmentId = searchParams.get('departmentId');
  if (departmentId) {
    const response = await ticketCategoryManager.getTicketCategoriesByDepartment(departmentId);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  }

  // Get all categories with filters
  const response = await ticketCategoryManager.getTicketCategories(operations);
  
  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect();

  const body = await request.json();

  if (!body) return NextResponse.json({ status: ERROR, message: INVALID_REQUEST, data: {} }, { status: 400 });

  const { action, data } = body;
  console.log("body only", body);

  if (!action) return NextResponse.json({ status: ERROR, message: INSUFFIENT_DATA, data: {} }, { status: 400 });

  // Convert string IDs to ObjectIds
  if (data.department) data.department = createMongooseObjectId(data.department);
  if (data.addedBy) data.addedBy = createMongooseObjectId(data.addedBy);
  if (data.updatedBy) data.updatedBy = createMongooseObjectId(data.updatedBy);
  let response: any = {};
  
  switch (action) {
    case "create":
      response = await ticketCategoryManager.createTicketCategory({ data });
      break;
    case "update":
      response = await ticketCategoryManager.updateTicketCategory({
        filter: { _id: data._id },
        data
      });
      break;
    default:
      response = { status: ERROR, message: INVALID_REQUEST };
  }

  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 });
}