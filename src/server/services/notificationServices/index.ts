import { crudManager } from "@/server/managers/crudManager";
import { catchAsync } from "@/server/shared/catchAsync";
import { NOTIFICATION_MASTER, SUCCESS } from "@/shared/constants";
import mongoose from "mongoose";

export const getNotifications = catchAsync(async ({ userId, isRead, limit = 10, page = 1 }) => {
  const filter: any = { isActive: true };
  
  if (userId) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }
  
  if (isRead !== undefined) {
    filter.isRead = isRead;
  }
  
  const result = await crudManager.mongooose.find(NOTIFICATION_MASTER, {
    filter,
    sort: { createdAt: 'desc' },
    pagination: {
      page,
      limit
    }
  });

  return result;
});

export const getNotificationCount = catchAsync(async ({ userId, isRead }) => {
  const filter: any = { isActive: true };
  
  if (userId) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }
  
  if (isRead !== undefined) {
    filter.isRead = isRead;
  }
  
  const result = await crudManager.mongooose.find(NOTIFICATION_MASTER, {
    filter,
    // Use distinct to efficiently count unique IDs
    distinct: "_id"
  });

  return {
    status: SUCCESS,
    data: { count: result.data.length }
  };
});

export const createNotification = catchAsync(async (notificationData) => {
  const result = await crudManager.mongooose.create(
    NOTIFICATION_MASTER,
    { data: notificationData }
  );
  return result;
});

export const markNotificationsAsRead = catchAsync(async ({ ids, userId }) => {
  const filter: any = { isActive: true };
  
  if (ids && ids.length > 0) {
    filter._id = { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
  } else if (userId) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  } else {
    return { 
      status: 'ERROR', 
      message: 'Either notification IDs or userId is required' 
    };
  }
  
  const result = await crudManager.mongooose.update(
    NOTIFICATION_MASTER,
    {
      filter,
      data: { isRead: true }
    }
  );
  
  return result;
});

export const deleteNotification = catchAsync(async ({ id }) => {
  if (!id) {
    return { 
      status: 'ERROR', 
      message: 'Notification ID is required'
    };
  }
  
  const result = await crudManager.mongooose.update(
    NOTIFICATION_MASTER,
    {
      filter: { _id: new mongoose.Types.ObjectId(id) },
      data: { isActive: false }
    }
  );
  
  return result;
}); 