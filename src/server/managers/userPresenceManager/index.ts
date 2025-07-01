// src/server/managers/userPresenceManager/index.ts
import { 
    setUserOnline,
    setUserOffline,
    updateUserStatus,
    getUserPresence,
    getOnlineUsers,
    cleanupStaleSessions
  } from '@/server/services/userPresenceServices';
  
  export const userPresenceManager = {
    setUserOnline,
    setUserOffline,
    updateUserStatus,
    getUserPresence,
    getOnlineUsers,
    cleanupStaleSessions
  };