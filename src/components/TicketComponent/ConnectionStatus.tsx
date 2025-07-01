// src/components/TicketComponent/ConnectionStatus.tsx
import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader, WifiOff, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;
  connectionAttempts: number;
  onReconnect: () => void;
  onTestServer?: () => void;
  className?: string;
}

// Simple utility function to check server availability
async function testSocketServer() {
  try {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log(`[TEST] Checking socket server at ${url}/api/ping`);
    
    const response = await fetch(`${url}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[TEST] Socket server responded:', data);
      return { success: true, data };
    } else {
      console.error('[TEST] Socket server returned error status:', response.status);
      return { success: false, error: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('[TEST] Error connecting to socket server:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * A component to display the current connection status with optimized rendering
 * to prevent unnecessary re-renders during typing.
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  connectionError,
  connectionAttempts = 0,
  onReconnect,
  onTestServer,
  className
}) => {
  // Function to test the socket server
  const handleServerTest = async () => {
    const result = await testSocketServer();
    if (result.success) {
      alert(`Socket server is available! Response: ${JSON.stringify(result.data)}`);
    } else {
      alert(`Socket server is NOT available! Error: ${result.error}`);
    }
  };

  if (isConnected) {
    return (
      <Badge 
        variant="outline" 
        className={cn("bg-green-50 text-green-700 flex items-center gap-1", className)}
      >
        <CheckCircle className="h-3 w-3" />
        <span className="hidden sm:inline">Connected</span>
      </Badge>
    );
  }
  
  if (isConnecting) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn("bg-yellow-50 text-yellow-700 flex items-center gap-1 animate-pulse", className)}
            >
              <Loader className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Connecting</span>
              {connectionAttempts > 1 && (
                <span className="text-xs ml-0.5">({connectionAttempts})</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {connectionAttempts > 1 ? 
              `Connection attempt ${connectionAttempts}` : 
              'Establishing connection...'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1">
              {connectionError ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {connectionError ? 'Error' : 'Offline'}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {connectionError || 'No connection to server'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onReconnect} 
        className="h-6 p-0 px-2"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        <span className="text-xs">Reconnect</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onTestServer || handleServerTest}
        className="h-6 p-0 px-2 ml-1"
      >
        <Activity className="h-3 w-3 mr-1" />
        <span className="text-xs">Test Server</span>
      </Button>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(ConnectionStatus);