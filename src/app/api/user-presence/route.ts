// src/app/api/user-presence/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import { userPresenceManager } from '@/server/managers/userPresenceManager';
import { ERROR, SUCCESS } from '@/shared/constants';

export async function GET(request: NextRequest) {
  // Ensure database connection
  await dbConnect();
  
  const searchParams = new URL(request.url).searchParams;
  const userId = searchParams.get('userId');
  
  if (userId) {
    // Get presence for specific user
    const response = await userPresenceManager.getUserPresence(userId);
    
    if (response.status === SUCCESS) {
      return NextResponse.json({ 
        status: SUCCESS, 
        message: SUCCESS, 
        data: response.data 
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  } else {
    // Get all online users
    const response:any = await userPresenceManager.getOnlineUsers();
    
    if (response.status === SUCCESS) {
      return NextResponse.json({ 
        status: SUCCESS, 
        message: SUCCESS, 
        data: response.data 
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Ensure database connection
  await dbConnect();
  
  const body = await request.json();
  
  if (!body) {
    return NextResponse.json({ 
      status: ERROR, 
      message: "Missing request body", 
      data: {} 
    }, { status: 400 });
  }
  
  const { action, userId, socketId, status } = body;
  
  if (!action || !userId) {
    return NextResponse.json({ 
      status: ERROR, 
      message: "Action and user ID are required", 
      data: {} 
    }, { status: 400 });
  }
  
  let response;
  
  switch (action) {
    case 'setOnline':
      response = await userPresenceManager.setUserOnline({ 
        userId, 
        socketId: socketId || 'manual-api', 
        status: status || 'online' 
      });
      break;
      
    case 'setOffline':
      response = await userPresenceManager.setUserOffline({ userId });
      break;
      
    case 'updateStatus':
      if (!status) {
        return NextResponse.json({ 
          status: ERROR, 
          message: "Status is required for updateStatus action", 
          data: {} 
        }, { status: 400 });
      }
      
      response = await userPresenceManager.updateUserStatus({ userId, status });
      break;
      
    default:
      return NextResponse.json({ 
        status: ERROR, 
        message: "Invalid action", 
        data: {} 
      }, { status: 400 });
  }
  
  if (response.status === SUCCESS) {
    return NextResponse.json({ 
      status: SUCCESS, 
      message: SUCCESS, 
      data: response.data 
    }, { status: 200 });
  }
  
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 }
  );
}