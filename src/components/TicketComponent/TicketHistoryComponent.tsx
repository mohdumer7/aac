// src/components/TicketComponent/TicketHistoryComponent.tsx
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { formatDistanceToNow } from 'date-fns';

interface TicketHistoryComponentProps {
  history: any[];
  isLoading: boolean;
}

const getHistoryActionLabel = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'created this ticket';
    case 'UPDATE':
      return 'updated this ticket';
    case 'ASSIGN':
      return 'assigned this ticket';
    case 'STATUS_CHANGE':
      return 'changed the status';
    case 'COMMENT':
      return 'commented on this ticket';
    case 'TASK_CREATE':
      return 'created a task';
    case 'TASK_UPDATE':
      return 'updated a task';
    case 'TASK_STATUS_CHANGE':
      return 'changed a task status';
    default:
      return action;
  }
};

const getHistoryDetails = (action: string, details: any) => {
  console.log({details})
  switch (action) {
    case 'STATUS_CHANGE':
      return `Status changed to ${details.status}`;
    case 'ASSIGN':
      return `Ticket assigned to ${details.assignees.map((assignee:any)=>`${assignee.firstName} ${assignee.lastName}`)}`;
    case 'TASK_CREATE':
      return `Created task: ${details.title}`;
    case 'TASK_STATUS_CHANGE':
      return `Changed task status to ${details.status}`;
    default:
      return null;
  }
};

const TicketHistoryComponent: React.FC<TicketHistoryComponentProps> = ({
  history,
  isLoading
}) => {
  console.log({history})
  return (
    <Card>
      <CardContent className="p-4">
        <DashboardLoader loading={isLoading}>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No history available for this ticket.
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-gray-200">
              {history.map((entry) => (
                <div key={entry._id} className="relative pl-10">
                  <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{`${entry.user.firstName[0]}${entry.user.lastName[0]}`}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {`${entry.user.firstName} ${entry.user.lastName}`}
                        </span>
                        <span className="text-gray-500">
                          {getHistoryActionLabel(entry.action)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {getHistoryDetails(entry.action, entry.details) && (
                      <p className="mt-1 text-sm text-gray-700">
                        {getHistoryDetails(entry.action, entry.details)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardLoader>
      </CardContent>
    </Card>
  );
};

export default TicketHistoryComponent;