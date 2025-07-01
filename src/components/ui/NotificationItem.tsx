"use client";

import React from 'react';
import { NotificationDocument } from '@/models/notification/Notification';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useMarkAsReadMutation, useDeleteNotificationMutation } from '@/services/endpoints/notificationApi';
import { toast } from 'react-toastify';

interface NotificationItemProps {
  notification: NotificationDocument;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const router = useRouter();
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const handleClick = async () => {
    try {
      // If not already read, mark as read
      if (!notification.isRead) {
        await markAsRead({ ids: [notification._id] });
        
        // Call the parent's onMarkAsRead if provided
        if (onMarkAsRead) {
          onMarkAsRead(notification._id);
        }
      }
      
      // Navigate to the link if provided
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      toast.error('Failed to update notification status');
    }
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    try {
      await deleteNotification({ id: notification._id });
      
      // Call the parent's onDelete if provided
      if (onDelete) {
        onDelete(notification._id);
      }
      
      toast.success('Notification removed');
    } catch (error) {
      toast.error('Failed to remove notification');
    }
  };

  return (
    <div 
      className={`relative p-3 border-b cursor-pointer transition-colors hover:bg-secondary/10 ${
        notification.isRead ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <div className="absolute top-2 right-2">
        <X 
          className="h-4 w-4 text-gray-400 hover:text-gray-600" 
          onClick={handleDelete}
        />
      </div>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
          </div>
          
          <p className="mt-1 text-sm text-gray-600">
            {notification.message}
          </p>
          
          <div className="mt-1 text-xs text-gray-500">
            {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
      
      {!notification.isRead && (
        <div className="absolute top-3 right-10">
          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationItem; 