import { NotificationDocument } from "@/models/notification/Notification";

/**
 * Create a new notification for a user
 * This can be used anywhere in the application to generate notifications
 */
export async function createNotification(notificationData: Partial<NotificationDocument>): Promise<any> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { status: 'ERROR', message: 'Failed to create notification' };
  }
}

/**
 * Create common notification templates
 */
export const notificationTemplates = {
  /**
   * Create a task assignment notification
   */
  taskAssigned: (params: { 
    userId: string; 
    taskId: string; 
    taskTitle: string; 
    assignedBy: string;
    assignedByName: string;
  }) => ({
    userId: params.userId,
    title: 'New Task Assigned',
    message: `${params.assignedByName} has assigned you a new task: ${params.taskTitle}`,
    type: 'info',
    source: 'tasks',
    link: `/dashboard/tasks/${params.taskId}`,
    data: {
      taskId: params.taskId,
      assignedBy: params.assignedBy
    }
  }),

  /**
   * Create a ticket update notification
   */
  ticketUpdated: (params: { 
    userId: string; 
    ticketId: string; 
    ticketTitle: string; 
    updatedBy: string;
    updatedByName: string;
    updateType: string;
  }) => ({
    userId: params.userId,
    title: 'Ticket Updated',
    message: `${params.updatedByName} has ${params.updateType} ticket: ${params.ticketTitle}`,
    type: 'info',
    source: 'tickets',
    link: `/dashboard/ticket/${params.ticketId}`,
    data: {
      ticketId: params.ticketId,
      updatedBy: params.updatedBy,
      updateType: params.updateType
    }
  }),

  /**
   * Create an approval request notification
   */
  approvalRequest: (params: { 
    userId: string; 
    requestId: string; 
    requestType: string;
    requestTitle: string;
    requestedBy: string;
    requestedByName: string;
  }) => ({
    userId: params.userId,
    title: 'Approval Required',
    message: `${params.requestedByName} has requested your approval for ${params.requestType}: ${params.requestTitle}`,
    type: 'warning',
    source: 'approvals',
    link: `/dashboard/approvals/${params.requestId}`,
    data: {
      requestId: params.requestId,
      requestType: params.requestType,
      requestedBy: params.requestedBy
    }
  }),

  /**
   * Create a general system notification
   */
  system: (params: { 
    userId: string; 
    title: string;
    message: string;
    link?: string;
  }) => ({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: 'info',
    source: 'system',
    link: params.link || '',
    data: {}
  })
}; 