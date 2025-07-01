// src/app/api/ticket-task/route.ts
import { ticketTaskManager } from '@/server/managers/ticketTaskManager';
import { ERROR, INSUFFIENT_DATA, INVALID_REQUEST, SUCCESS } from '@/shared/constants';
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
  try {
    // Ensure database connection and models are initialized
    await dbConnect();
    console.log("GET Task API called");

    const searchParams = new URL(request.url).searchParams;

    // Get tasks by ticket ID
    const ticketId = searchParams.get('ticketId');
    if (ticketId) {
      console.log(`Fetching tasks for ticket: ${ticketId}`);
      const response = await ticketTaskManager.getTicketTasksByTicketId(ticketId);
      console.log(`Task fetch response: ${JSON.stringify(response.status)}`);
      
      if (response.status === SUCCESS) {
        return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
      }
      return NextResponse.json(
        { status: 'ERROR', message: response.message, data: {} },
        { status: 500 }
      );
    }

    // If no ticketId provided, return error
    return NextResponse.json(
      { status: 'ERROR', message: 'Ticket ID is required', data: {} },
      { status: 400 }
    );
  } catch (error:any) {
    console.error("Error in GET task API:", error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message, data: {} },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection and models are initialized
    await dbConnect();
    console.log("POST Task API called");

    // Get the raw request body as text for debugging
    const rawRequest = await request.text();
    console.log("Raw task request:", rawRequest);
    
    // Parse the JSON body
    let body;
    try {
      body = JSON.parse(rawRequest);
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ 
        status: ERROR, 
        message: "Invalid JSON in request", 
        data: {} 
      }, { status: 400 });
    }

    console.log("Parsed task request body:", JSON.stringify(body, null, 2));
    
    if (!body) {
      return NextResponse.json({ 
        status: ERROR, 
        message: INVALID_REQUEST, 
        data: {} 
      }, { status: 400 });
    }

    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ 
        status: ERROR, 
        message: INSUFFIENT_DATA, 
        data: {} 
      }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ 
        status: ERROR, 
        message: "Task data is required", 
        data: {} 
      }, { status: 400 });
    }

    // For create action, validate required fields
    if (action === 'create') {
      if (!data.title || !data.title.trim()) {
        return NextResponse.json({ 
          status: ERROR, 
          message: "Task title is required", 
          data: {} 
        }, { status: 400 });
      }
      
      if (!data.ticket) {
        return NextResponse.json({ 
          status: ERROR, 
          message: "Ticket ID is required", 
          data: {} 
        }, { status: 400 });
      }
    }

    // Convert string IDs to ObjectIds safely
    const processedData = { ...data };

    try {
      if (processedData.ticket && typeof processedData.ticket === 'string') {
        console.log("Converting ticket ID from string:", processedData.ticket);
        processedData.ticket = new mongoose.Types.ObjectId(processedData.ticket);
      }
      
      if (processedData.assignee && typeof processedData.assignee === 'string') {
        processedData.assignee = new mongoose.Types.ObjectId(processedData.assignee);
      }
      
      if (processedData.addedBy && typeof processedData.addedBy === 'string') {
        processedData.addedBy = new mongoose.Types.ObjectId(processedData.addedBy);
      }
      
      if (processedData.updatedBy && typeof processedData.updatedBy === 'string') {
        processedData.updatedBy = new mongoose.Types.ObjectId(processedData.updatedBy);
      }
    } catch (error) {
      console.error("Error converting IDs:", error);
      return NextResponse.json({ 
        status: ERROR, 
        message: "Invalid ID format provided", 
        data: {} 
      }, { status: 400 });
    }

    console.log("Processed task data:", JSON.stringify(processedData, null, 2));
    console.log("Task action:", action);

    let response:any;
    switch (action) {
      case "create":
        response = await ticketTaskManager.createTicketTask({ data: processedData });
        break;
      case "update":
        if (!processedData._id) {
          return NextResponse.json({ 
            status: ERROR, 
            message: "Task ID is required for update", 
            data: {} 
          }, { status: 400 });
        }
        response = await ticketTaskManager.updateTicketTask({
          filter: { _id: processedData._id },
          data: processedData
        });
        break;
      case "changeStatus":
        response = await ticketTaskManager.changeTaskStatus({
          taskId: processedData._id,
          status: processedData.status,
          progress: processedData.progress,
          updatedBy: processedData.updatedBy,
          ticketId: processedData.ticket
        });
        break;
      default:
        response = { status: ERROR, message: INVALID_REQUEST };
    }

    console.log("Task service response:", JSON.stringify(response, null, 2));

    if (response.status === SUCCESS) {
      return NextResponse.json({ 
        status: SUCCESS, 
        message: SUCCESS, 
        data: response?.data 
      }, { status: 200 });
    }
    
    return NextResponse.json({
      status: 'ERROR', 
      message: response.message, 
      data: {} 
    }, { status: 500 });
  } catch (error:any) {
    console.error("Unhandled error in task API:", error);
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error.message || "An unexpected error occurred", 
      error: error,
      data: {} 
    }, { status: 500 });
  }
}