// src/server/services/ticketTaskServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { createTicketHistory } from '../ticketHistoryServices';
import { calculateTicketProgress } from '../ticketServices';
import { SUCCESS, ERROR } from '@/shared/constants';
import mongoose from 'mongoose';

export const getTicketTasks = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('TICKET_TASK_MASTER', options);
  return result;
});

export const getTicketTasksByTicketId = catchAsync(async (ticketId) => {
  console.log(`getTicketTasksByTicketId called with ID: ${ticketId}`);
  const result = await crudManager.mongooose.find('TICKET_TASK_MASTER', {
    filter: { 
      ticket: ticketId,
      isActive: true
    },
    sort: { createdAt: 'asc' }
  });
  console.log(`Tasks found: ${result.data ? result.data.length : 0}`);
  return result;
});

export const createTicketTask = catchAsync(async (options) => {
  // Log the entire input
  console.log("Creating task with raw options:", JSON.stringify(options, null, 2));
  
  // Validate input structure
  if (!options || !options.data) {
    console.error("Task data missing in createTicketTask");
    return { status: ERROR, message: "Task data is required" };
  }
  
  const { data } = options;
  
  // Check for required fields
  if (!data.title || !data.title.trim()) {
    console.error("Missing title in task data");
    return { status: ERROR, message: "Task title is required" };
  }
  
  if (!data.ticket) {
    console.error("Missing ticket ID in task data");
    return { status: ERROR, message: "Ticket ID is required" };
  }
  
  try {
    // Prepare the task data
    const taskData = {
      ...data,
      // Ensure we have default values
      status: data.status || 'TODO',
      progress: data.progress || 0,
      efforts: data.efforts || 1,
      isActive: true
    };
    
    console.log("Processed task data for creation:", JSON.stringify(taskData, null, 2));
    
    // Create the task
    const result = await crudManager.mongooose.create('TICKET_TASK_MASTER', { data: taskData });
    console.log("Task creation result:", JSON.stringify(result, null, 2));
    
    // If successful, create a history record
    if (result.status === SUCCESS) {
      try {
        await createTicketHistory({
          data: {
            ticket: taskData.ticket,
            action: 'TASK_CREATE',
            user: taskData.addedBy,
            details: { 
              taskId: result.data._id, 
              title: taskData.title 
            }
          }
        });
        
        // Recalculate ticket progress
        await calculateTicketProgress(taskData.ticket);
      } catch (historyError) {
        console.error("Failed to create history entry for task:", historyError);
        // We don't fail the whole operation if just the history entry fails
      }
    }
    
    return result;
  } catch (error:any) {
    console.error("Error in createTicketTask:", error);
    return {
      status: ERROR,
      message: error.message || "Failed to create task"
    };
  }
});

export const updateTicketTask = catchAsync(async (options) => {
  console.log("Updating task with options:", JSON.stringify(options, null, 2));
  
  if (!options.filter || !options.filter._id) {
    return { status: ERROR, message: "Task ID is required for update" };
  }
  
  if (!options.data) {
    return { status: ERROR, message: "Update data is required" };
  }
  
  try {
    const result = await crudManager.mongooose.update('TICKET_TASK_MASTER', options);
    
    // Create ticket history entry for task update
    if (result.status === SUCCESS) {
      // Get the ticket ID from the task
      const task = result.data;
      
      await createTicketHistory({
        data: {
          ticket: task.ticket,
          action: 'TASK_UPDATE',
          user: options.data.updatedBy,
          details: { taskId: options.filter._id, updates: options.data }
        }
      });
      
      // Recalculate ticket progress
      await calculateTicketProgress(task.ticket);
    }
    
    return result;
  } catch (error:any) {
    console.error("Error in updateTicketTask:", error);
    return {
      status: ERROR,
      message: error.message || "Failed to update task"
    };
  }
});

export const changeTaskStatus = catchAsync(async (options) => {
  console.log("Changing task status with options:", JSON.stringify(options, null, 2));
  
  const { taskId, status, progress, updatedBy, ticketId } = options;
  
  if (!taskId) {
    return { status: ERROR, message: "Task ID is required" };
  }
  
  if (!ticketId) {
    return { status: ERROR, message: "Ticket ID is required" };
  }
  
  if (!status) {
    return { status: ERROR, message: "Status is required" };
  }
  
  try {
    // Convert to ObjectId if needed
    const taskObjectId = typeof taskId === 'string' 
      ? new mongoose.Types.ObjectId(taskId) 
      : taskId;
    
    const ticketObjectId = typeof ticketId === 'string'
      ? new mongoose.Types.ObjectId(ticketId)
      : ticketId;
    
    const result = await crudManager.mongooose.update('TICKET_TASK_MASTER', {
      filter: { _id: taskObjectId },
      data: { 
        status,
        progress: status === 'COMPLETED' ? 100 : (progress || 0),
        updatedBy
      }
    });
    
    // Create ticket history entry for status change
    if (result.status === SUCCESS) {
      await createTicketHistory({
        data: {
          ticket: ticketObjectId,
          action: 'TASK_STATUS_CHANGE',
          user: updatedBy,
          details: { taskId: taskObjectId, status }
        }
      });
      
      // Recalculate ticket progress
      await calculateTicketProgress(ticketObjectId);
    }
    
    return result;
  } catch (error:any) {
    console.error("Error in changeTaskStatus:", error);
    return {
      status: ERROR,
      message: error.message || "Failed to change task status"
    };
  }
});