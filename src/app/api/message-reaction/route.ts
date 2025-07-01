// src/app/api/message-reaction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import { messageReactionManager } from '@/server/managers/messageReactionManager';
import { ERROR, SUCCESS } from '@/shared/constants';

export async function GET(request: NextRequest) {
  // Ensure database connection
  await dbConnect();
  
  const searchParams = new URL(request.url).searchParams;
  const messageId = searchParams.get('messageId');
  
  if (!messageId) {
    return NextResponse.json({ 
      status: ERROR, 
      message: "Message ID is required", 
      data: {} 
    }, { status: 400 });
  }
  
  const response = await messageReactionManager.getMessageReactions(messageId);
  
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
  
  const { action, messageId, userId, emoji } = body;
  
  if (!action || !messageId || !userId || !emoji) {
    return NextResponse.json({ 
      status: ERROR, 
      message: "Action, message ID, user ID, and emoji are required", 
      data: {} 
    }, { status: 400 });
  }
  
  let response;
  
  switch (action) {
    case 'add':
      response = await messageReactionManager.addReaction({ 
        messageId, 
        userId, 
        emoji 
      });
      break;
      
    case 'remove':
      response = await messageReactionManager.removeReaction({ 
        messageId, 
        userId, 
        emoji 
      });
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