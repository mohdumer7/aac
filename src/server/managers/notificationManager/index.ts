import { 
  getNotifications, 
  createNotification, 
  markNotificationsAsRead, 
  deleteNotification,
  getNotificationCount
} from "@/server/services/notificationServices";

export const notificationManager = {
  getNotifications,
  createNotification,
  markNotificationsAsRead,
  deleteNotification,
  getNotificationCount
} 