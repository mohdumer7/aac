import { notificationManager } from '@/server/managers/notificationManager';
import { BODY_REQUIRED, ERROR, SUCCESS } from '@/shared/constants';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  
  const userId = searchParams.get('userId');
  const isRead = searchParams.has('isRead') ? searchParams.get('isRead') === 'true' : undefined;
  const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10;
  const page = searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1;
  
  const response: any = await notificationManager.getNotifications({ 
    userId, 
    isRead, 
    limit, 
    page 
  });
  
  if (response.status === SUCCESS) {
    return NextResponse.json({
      status: SUCCESS,
      message: SUCCESS,
      data: response.data
    }, { status: 200 });
  }
  
  return NextResponse.json({
    status: ERROR,
    message: response.message || 'Failed to fetch notifications',
    data: {}
  }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!body) {
    return NextResponse.json({
      status: ERROR,
      message: BODY_REQUIRED,
      data: {}
    }, { status: 400 });
  }
  
  // Add user info if available from token
  if (token?.sub) {
    body.addedBy = token.sub;
    body.updatedBy = token.sub;
  }
  
  const response: any = await notificationManager.createNotification(body);
  
  if (response.status === SUCCESS) {
    return NextResponse.json({
      status: SUCCESS,
      message: SUCCESS,
      data: response.data
    }, { status: 200 });
  }
  
  return NextResponse.json({
    status: ERROR,
    message: response.message || 'Failed to create notification',
    data: {}
  }, { status: 500 });
} 