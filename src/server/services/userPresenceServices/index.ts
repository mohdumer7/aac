// src/server/services/userPresenceServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { ERROR, SUCCESS } from '@/shared/constants';
import mongoose from 'mongoose';

// In-memory user presence tracking (for active sessions)
const onlineUsers = new Map<string, {
  lastActive: Date;
  socketId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}>();

// Set user as online
export const setUserOnline = catchAsync(async ({ userId, socketId, status = 'online' }) => {
  if (!userId || !socketId) {
    return { status: ERROR, message: "User ID and Socket ID are required" };
  }
  
  onlineUsers.set(userId, {
    lastActive: new Date(),
    socketId,
    status
  });
  
  // Update user status in database (optional)
  await crudManager.mongooose.update('USER_MASTER', {
    filter: { _id: userId },
    data: { 
      lastActive: new Date(),
      onlineStatus: status
    }
  });
  
  return { 
    status: SUCCESS, 
    data: { userId, status } 
  };
});

// Set user as offline
export const setUserOffline = catchAsync(async ({ userId }) => {
  if (!userId) {
    return { status: ERROR, message: "User ID is required" };
  }
  
  onlineUsers.delete(userId);
  
  // Update user status in database (optional)
  await crudManager.mongooose.update('USER_MASTER', {
    filter: { _id: userId },
    data: { 
      lastActive: new Date(),
      onlineStatus: 'offline'
    }
  });
  
  return { 
    status: SUCCESS, 
    data: { userId, status: 'offline' } 
  };
});

// Update user status
export const updateUserStatus = catchAsync(async ({ userId, status }) => {
  if (!userId || !status) {
    return { status: ERROR, message: "User ID and status are required" };
  }
  
  const userPresence = onlineUsers.get(userId);
  if (userPresence) {
    userPresence.status = status;
    userPresence.lastActive = new Date();
    onlineUsers.set(userId, userPresence);
  }
  
  // Update user status in database (optional)
  await crudManager.mongooose.update('USER_MASTER', {
    filter: { _id: userId },
    data: { 
      lastActive: new Date(),
      onlineStatus: status
    }
  });
  
  return { 
    status: SUCCESS, 
    data: { userId, status } 
  };
});

// Get user presence
export const getUserPresence = catchAsync(async (userId) => {
  if (!userId) {
    return { status: ERROR, message: "User ID is required" };
  }
  
  const userPresence = onlineUsers.get(userId);
  
  if (userPresence) {
    return { 
      status: SUCCESS, 
      data: { 
        userId, 
        isOnline: true,
        status: userPresence.status,
        lastActive: userPresence.lastActive
      } 
    };
  }
  
  // Fallback to database for last seen
  const user = await crudManager.mongooose.find('USER_MASTER', {
    filter: { _id: userId },
    select: ['lastActive', 'onlineStatus']
  });
  
  if (user.status === SUCCESS && user.data.length > 0) {
    return {
      status: SUCCESS,
      data: {
        userId,
        isOnline: false,
        status: user.data[0].onlineStatus || 'offline',
        lastActive: user.data[0].lastActive
      }
    };
  }
  
  return {
    status: SUCCESS,
    data: {
      userId,
      isOnline: false,
      status: 'offline',
      lastActive: null
    }
  };
});

// Get all online users
export const getOnlineUsers = catchAsync(async () => {
  const users = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
    userId,
    status: data.status,
    lastActive: data.lastActive
  }));
  
  return {
    status: SUCCESS,
    data: users
  };
});

// Clean up stale sessions (older than 30 minutes)
export const cleanupStaleSessions = catchAsync(async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  let removedCount = 0;
  for (const [userId, data] of onlineUsers.entries()) {
    if (data.lastActive < thirtyMinutesAgo) {
      onlineUsers.delete(userId);
      removedCount++;
    }
  }
  
  return {
    status: SUCCESS,
    data: { removedCount }
  };
});