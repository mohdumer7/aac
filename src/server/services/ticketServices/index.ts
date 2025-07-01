// src/server/services/ticketServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { ERROR, SUCCESS } from '@/shared/constants';
import { ObjectId } from 'mongoose';
import { generateTicketId } from '@/shared/functions';
import { createTicketHistory } from '../ticketHistoryServices';

export const getTickets = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('TICKET_MASTER', options);
  return result;
});

export const getTicketById = catchAsync(async (id) => {
  const result = await crudManager.mongooose.find('TICKET_MASTER', {
    filter: { _id: id }
  });
  return result;
});

export const createTicket = catchAsync(async (options) => {
  // Generate a unique ticket ID
  const ticketId = await generateTicketId();
  options.data.ticketId = ticketId;
  
  const result = await crudManager.mongooose.create('TICKET_MASTER', options);
  
  // Create ticket history entry
  if (result.status === SUCCESS) {
    await createTicketHistory({
      data: {
        ticket: result.data._id,
        action: 'CREATE',
        user: options.data.creator,
        details: { 
          // Use _id instead of ticketId
          _id: result.data._id,
          title: options.data.title 
        }
      }
    });
  }
  
  return result;
});

export const updateTicket = catchAsync(async (options) => {
  console.log("Ticket update service called with:", options);
  
  // Make sure we're not sending empty update data
  if (!options.data || Object.keys(options.data).length === 0) {
    return { status: ERROR, message: "No update data provided" };
  }

  // Ensure we have a filter
  if (!options.filter || !options.filter._id) {
    return { status: ERROR, message: "Ticket ID is required for updates" };
  }
  
  const result = await crudManager.mongooose.update('TICKET_MASTER', options);
  
  console.log("Ticket update result:", result);
  
  // Create ticket history entry for updates
  if (result.status === SUCCESS) {
    await createTicketHistory({
      data: {
        ticket: options.filter._id,
        action: options.data.status ? 'STATUS_CHANGE' : 'UPDATE',
        user: options.data.updatedBy,
        details: options.data.status 
          ? { status: options.data.status }
          : options.data
      }
    });
  }
  
  return result;
});

export const assignTicket = catchAsync(async (options) => {
  const { ticketId, assigneeId, updatedBy } = options;
  
  const result = await crudManager.mongooose.update('TICKET_MASTER', {
    filter: { _id: ticketId },
    data: { 
      assignee: assigneeId,
      status: 'ASSIGNED',
      updatedBy
    }
  });
  
  // Create ticket history entry for assignment
  if (result.status === SUCCESS) {
    await createTicketHistory({
      data: {
        ticket: ticketId,
        action: 'ASSIGN',
        user: updatedBy,
        details: { assignee: assigneeId }
      }
    });
  }
  
  return result;
});

export const updateTicketAssignees = catchAsync(async (options) => {
  const { ticketId, assignees, updatedBy } = options;
  
  // Validate inputs
  if (!ticketId || !assignees || !Array.isArray(assignees)) {
    return { status: ERROR, message: "Invalid assignees data" };
  }
  
  // Update ticket with multiple assignees
  const result = await crudManager.mongooose.update('TICKET_MASTER', {
    filter: { _id: ticketId },
    data: { 
      assignees,
      // If there are assignees, set status to ASSIGNED
      ...(assignees.length > 0 && { status: 'ASSIGNED' }),
      updatedBy
    }
  });
  
  // Create ticket history entry for assignment
  if (result.status === SUCCESS) {
    await createTicketHistory({
      data: {
        ticket: ticketId,
        action: 'ASSIGN',
        user: updatedBy,
        details: { assignees }
      }
    });
  }
  
  return result;
});

export const changeTicketStatus = catchAsync(async (options) => {
  const { ticketId, status, updatedBy } = options;
  
  const result = await crudManager.mongooose.update('TICKET_MASTER', {
    filter: { _id: ticketId },
    data: { 
      status,
      updatedBy
    }
  });
  
  // Create ticket history entry for status change
  if (result.status === SUCCESS) {
    await createTicketHistory({
      data: {
        ticket: ticketId,
        action: 'STATUS_CHANGE',
        user: updatedBy,
        details: { status }
      }
    });
  }
  
  return result;
});

export const calculateTicketProgress = catchAsync(async (ticketId) => {
  // Get all tasks for the ticket
  const tasks = await crudManager.mongooose.find('TICKET_TASK_MASTER', {
    filter: { ticket: ticketId }
  });
  
  if (tasks.status !== SUCCESS) {
    return { status: ERROR, message: "Failed to get tasks" };
  }
  
  // Calculate progress based on task status and progress
  let totalEfforts = 0;
  let completedEfforts = 0;
  
  tasks.data.forEach((task:any) => {
    totalEfforts += task.efforts || 0;
    if (task.status === 'COMPLETED') {
      completedEfforts += task.efforts || 0;
    } else if (task.status === 'IN_PROGRESS' && task.progress) {
      completedEfforts += (task.efforts || 0) * (task.progress / 100);
    }
  });
  
  const overallProgress = totalEfforts > 0 ? (completedEfforts / totalEfforts) * 100 : 0;
  
  // Update ticket with calculated progress
  const result = await crudManager.mongooose.update('TICKET_MASTER', {
    filter: { _id: ticketId },
    data: { 
      efforts: completedEfforts,
      totalEfforts
    }
  });
  
  return result;
});

export const autoAssignTicket = catchAsync(async (options) => {
  const { ticketId, departmentId, categoryId, updatedBy } = options;
  
  // Get department users with skills in the ticket category
  const users = await crudManager.mongooose.find('USER_MASTER', {
    filter: { 
      department: departmentId,
      isActive: true
    }
  });
  
  if (users.status !== SUCCESS || !users.data.length) {
    return { status: ERROR, message: "No active users found in the department" };
  }
  
  // Get user skills for category
  const userSkills = await crudManager.mongooose.find('USER_SKILL_MASTER', {
    filter: { 
      category: categoryId,
      isActive: true
    }
  });
  
  // Get current assigned tickets for workload calculation
  const assignedTickets = await crudManager.mongooose.find('TICKET_MASTER', {
    filter: { 
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      isActive: true
    }
  });
  
  // Calculate score for each user based on skill and current workload
  const userScores = users.data.map((user:any) => {
    // Find skill rating for this category (0-5)
    const skillRating = userSkills.data.find((skill:any) => 
      skill.user._id.toString() === user._id.toString()
    )?.rating || 0;
    
    // Count current assigned tickets
    const workload = assignedTickets.data.filter((ticket:any) => 
      ticket.assignee?._id.toString() === user._id.toString()
    ).length;
    
    // Calculate score (higher is better)
    // Prioritize skill rating but also consider workload
    const score = (skillRating * 2) - workload;
    
    return {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      score
    };
  });
  
  // Sort by score (highest first)
  userScores.sort((a:any, b:any) => b.score - a.score);
  
  // Select the best user
  const bestUser = userScores[0];
  
  if (!bestUser) {
    return { status: ERROR, message: "Could not find suitable assignee" };
  }
  
  // Assign the ticket
  const result = await assignTicket({
    ticketId,
    assigneeId: bestUser.userId,
    updatedBy
  });
  
  return result;
});