import { notificationManager } from '@/server/managers/notificationManager';
import { BODY_REQUIRED, ERROR, SUCCESS } from '@/shared/constants';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
  
  // You need to provide either specific IDs or a userId
  if (!body.ids?.length && !body.userId) {
    return NextResponse.json({
      status: ERROR,
      message: 'Either notification IDs or userId is required',
      data: {}
    }, { status: 400 });
  }
  
  // Add user info if available from token
  if (token?.sub) {
    body.updatedBy = token.sub;
  }
  
  const response: any = await notificationManager.markNotificationsAsRead({
    ids: body.ids,
    userId: body.userId
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
    message: response.message || 'Failed to mark notifications as read',
    data: {}
  }, { status: 500 });
} 