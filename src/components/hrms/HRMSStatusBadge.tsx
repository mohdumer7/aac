'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  MinusCircleIcon,
  SendIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type HRMSStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'withdrawn'
  | 'expired'
  | 'in_progress'
  | 'under_review';

interface HRMSStatusBadgeProps {
  status: HRMSStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const statusConfig: Record<HRMSStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    icon: FileTextIcon,
    color: 'text-slate-600'
  },
  submitted: {
    label: 'Submitted',
    variant: 'default',
    icon: SendIcon,
    color: 'text-blue-600'
  },
  pending: {
    label: 'Pending Approval',
    variant: 'outline',
    icon: ClockIcon,
    color: 'text-orange-600'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'outline',
    icon: ClockIcon,
    color: 'text-blue-600'
  },
  under_review: {
    label: 'Under Review',
    variant: 'outline',
    icon: AlertCircleIcon,
    color: 'text-yellow-600'
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    icon: CheckCircleIcon,
    color: 'text-green-600'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    icon: XCircleIcon,
    color: 'text-red-600'
  },
  withdrawn: {
    label: 'Withdrawn',
    variant: 'secondary',
    icon: MinusCircleIcon,
    color: 'text-gray-600'
  },
  expired: {
    label: 'Expired',
    variant: 'secondary',
    icon: AlertCircleIcon,
    color: 'text-gray-600'
  }
};

export default function HRMSStatusBadge({ 
  status, 
  className, 
  showIcon = true, 
  size = 'default' 
}: HRMSStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm',
    lg: 'text-base px-3 py-1'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1',
        sizeClasses[size],
        config.color,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

// Utility function to get status from form data
export function getFormStatus(form: any): HRMSStatus {
  if (form.isDraft) return 'draft';
  if (form.status) return form.status as HRMSStatus;
  return 'draft';
}

// Utility function to get status color for charts/displays
export function getStatusColor(status: HRMSStatus): string {
  const config = statusConfig[status] || statusConfig.draft;
  return config.color;
}

// Group statuses for filtering
export const statusGroups = {
  active: ['submitted', 'pending', 'in_progress', 'under_review'],
  completed: ['approved', 'rejected'],
  inactive: ['draft', 'withdrawn', 'expired']
};

export function getStatusGroup(status: HRMSStatus): keyof typeof statusGroups {
  for (const [group, statuses] of Object.entries(statusGroups)) {
    if (statuses.includes(status)) {
      return group as keyof typeof statusGroups;
    }
  }
  return 'inactive';
}