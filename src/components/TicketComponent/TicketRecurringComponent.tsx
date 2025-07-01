// src/components/TicketComponent/TicketRecurringComponent.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Calendar, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUpdateTicketMutation } from '@/services/endpoints/ticketApi';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TicketRecurringComponentProps {
  ticketId: string;
  isRecurring: boolean;
  recurringType: string;
  recurringEndDate?: Date;
  recurringInterval?: number;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const TicketRecurringComponent: React.FC<TicketRecurringComponentProps> = ({
  ticketId,
  isRecurring = false,
  recurringType = 'WEEKLY',
  recurringEndDate,
  recurringInterval = 1,
  isOpen,
  onClose,
  userId
}) => {
  const [enabled, setEnabled] = useState(isRecurring);
  const [type, setType] = useState(recurringType);
  const [interval, setInterval] = useState(recurringInterval.toString());
  const [endDate, setEndDate] = useState<Date | undefined>(recurringEndDate ? new Date(recurringEndDate) : undefined);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation();
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEnabled(isRecurring);
      setType(recurringType);
      setInterval(recurringInterval?.toString() || '1');
      setEndDate(recurringEndDate ? new Date(recurringEndDate) : undefined);
      setFormError(null);
    }
  }, [isOpen, isRecurring, recurringType, recurringInterval, recurringEndDate]);
  
  // Calculate next recurring date based on current settings
  const calculateNextRecurringDate = () => {
    const today = new Date();
    
    switch (type) {
      case 'DAILY':
        return addDays(today, parseInt(interval) || 1);
      case 'WEEKLY':
        return addWeeks(today, parseInt(interval) || 1);
      case 'MONTHLY':
        return addMonths(today, parseInt(interval) || 1);
      case 'CUSTOM':
        return addDays(today, parseInt(interval) || 7);
      default:
        return addWeeks(today, 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setFormError(null);
      
      if (enabled && !endDate) {
        setFormError('Please select an end date for recurring tickets');
        return;
      }
      
      const nextDate = enabled ? calculateNextRecurringDate() : undefined;
      
      await updateTicket({
        _id: ticketId,
        isRecurring: enabled,
        recurringType: type,
        recurringInterval: parseInt(interval) || 1,
        recurringEndDate: endDate,
        nextRecurringDate: nextDate,
        updatedBy: userId
      }).unwrap();
      
      toast.success('Recurring settings updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update recurring settings:', error);
      setFormError('Failed to update recurring settings. Please try again.');
      toast.error('Failed to update recurring settings');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Recurring Ticket Settings</DialogTitle>
          <DialogDescription>
            Configure how often this ticket should recur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {formError && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring-toggle" className="font-medium">Enable Recurring</Label>
            <Switch
              id="recurring-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          {enabled && (
            <>
              <div className="space-y-3">
                <Label className="font-medium">Recurrence Pattern</Label>
                <Select
                  value={type}
                  onValueChange={setType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {type === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval (days)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="365"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {endDate && (
                  <div className="flex items-center mt-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {format(endDate, "MMMM d, yyyy")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 rounded-full"
                      onClick={() => setEndDate(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Next Occurrence
                </h4>
                <p className="text-sm text-blue-700">
                  {format(calculateNextRecurringDate(), 'MMMM d, yyyy')}
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isUpdating}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketRecurringComponent;