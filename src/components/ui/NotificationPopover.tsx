"use client";

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useGetNotificationsQuery, useGetNotificationCountQuery, useMarkAsReadMutation } from '@/services/endpoints/notificationApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import useUserAuthorised from '@/hooks/useUserAuthorised';

interface NotificationPopoverProps {
  maxHeight?: string;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ maxHeight = '400px' }) => {
  const { user } = useUserAuthorised();
  const userId = user?._id;
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  
  // Get unread notification count
  const { data: countData, refetch: refetchCount } = useGetNotificationCountQuery(
    { userId, isRead: false },
    { skip: !userId, pollingInterval: 30000 } // Refresh every 30 seconds
  );
  
  // Get notifications based on active tab
  const { data: notifications, refetch: refetchNotifications } = useGetNotificationsQuery(
    { 
      userId, 
      isRead: activeTab === 'read' ? true : activeTab === 'unread' ? false : undefined,
      limit: 20
    },
    { skip: !userId }
  );
  
  const [markAsRead] = useMarkAsReadMutation();
  
  // Count of unread notifications
  const unreadCount = countData?.data?.count || 0;
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAsRead({ userId });
      refetchNotifications();
      refetchCount();
    }
  };
  
  // Handle individual notification marking as read
  const handleMarkAsRead = (id: string) => {
    refetchNotifications();
    refetchCount();
  };
  
  // Handle notification delete
  const handleDelete = (id: string) => {
    refetchNotifications();
    refetchCount();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          {activeTab === 'unread' && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="unread" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="read" className="flex-1">Read</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="p-0">
            <ScrollArea style={{ height: maxHeight }}>
              {notifications?.data?.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No unread notifications
                </div>
              ) : (
                notifications?.data?.map((notification: any) => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="p-0">
            <ScrollArea style={{ height: maxHeight }}>
              {notifications?.data?.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications?.data?.map((notification: any) => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="read" className="p-0">
            <ScrollArea style={{ height: maxHeight }}>
              {notifications?.data?.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No read notifications
                </div>
              ) : (
                notifications?.data?.map((notification: any) => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover; 