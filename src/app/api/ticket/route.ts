// src/app/api/ticket/route.ts
import { ticketManager } from '@/server/managers/ticketManager';
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

  // Process pagination parameters
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  if (page && limit) {
    operations.pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  // Get specific ticket by ID
  const id = searchParams.get('id');
  if (id) {
    const response = await ticketManager.getTicketById(id);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 404 }
    );
  }

  // Get all tickets with filters
  const response = await ticketManager.getTickets(operations);
  
  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data, pagination: response.pagination }, { status: 200 });
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

  if (!action) return NextResponse.json({ status: ERROR, message: INSUFFIENT_DATA, data: {} }, { status: 400 });

  // Convert string IDs to ObjectIds
  if (data.creator) data.creator = createMongooseObjectId(data.creator);
  if (data.department) data.department = createMongooseObjectId(data.department);
  if (data.category) data.category = createMongooseObjectId(data.category);
  if (data.assignee) data.assignee = createMongooseObjectId(data.assignee);
  // Handle multiple assignees
  if (data.assignees && Array.isArray(data.assignees)) {
    data.assignees = data.assignees.map((id: string) => createMongooseObjectId(id));
  }
  
  if (data.addedBy) data.addedBy = createMongooseObjectId(data.addedBy);
  if (data.updatedBy) data.updatedBy = createMongooseObjectId(data.updatedBy);

  let response: any = {};
  
  switch (action) {
    case "create":
      response = await ticketManager.createTicket({ data });
      break;
      case "update":
        // Log the update data
        console.log("Updating ticket with data:", data);
        
        if (!data._id) {
          return NextResponse.json({ status: ERROR, message: "Ticket ID is required for updates", data: {} }, { status: 400 });
        }
        
        response = await ticketManager.updateTicket({
          filter: { _id: data._id },
          data: {
            ...(data.status && { status: data.status }),
            ...(data.priority && { priority: data.priority }),
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.department && { department: createMongooseObjectId(data.department) }),
            ...(data.category && { category: createMongooseObjectId(data.category) }),
            ...(data.assignee && { assignee: createMongooseObjectId(data.assignee) }),
            ...(data.assignees && { assignees: data.assignees.map((id: string) => createMongooseObjectId(id)) }),
            ...(data.dueDate && { dueDate: data.dueDate }),
            updatedBy: createMongooseObjectId(data.updatedBy)
          }
        });
        break;
    case "assign":
      response = await ticketManager.assignTicket({
        ticketId: data.ticketId,
        assigneeId: data.assigneeId,
        updatedBy: data.updatedBy
      });
      break;
    case "updateAssignees":
      response = await ticketManager.updateTicketAssignees({
        ticketId: data.ticketId,
        assignees: data.assignees,
        updatedBy: data.updatedBy
      });
      break;
      
      
    case "changeStatus":
      response = await ticketManager.changeTicketStatus({
        ticketId: data.ticketId,
        status: data.status,
        updatedBy: data.updatedBy
      });
      break;
    case "autoAssign":
      response = await ticketManager.autoAssignTicket({
        ticketId: data.ticketId,
        departmentId: data.departmentId,
        categoryId: data.categoryId,
        updatedBy: data.updatedBy
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