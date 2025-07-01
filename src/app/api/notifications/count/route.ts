import { notificationManager } from '@/server/managers/notificationManager';
import { ERROR, SUCCESS } from '@/shared/constants';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  
  const userId = searchParams.get('userId');
  const isRead = searchParams.has('isRead') ? searchParams.get('isRead') === 'true' : undefined;
  
  const response: any = await notificationManager.getNotificationCount({ userId, isRead });
  
  if (response.status === SUCCESS) {
    return NextResponse.json({
      status: SUCCESS,
      message: SUCCESS,
      data: response.data
    }, { status: 200 });
  }
  
  return NextResponse.json({
    status: ERROR,
    message: response.message || 'Failed to fetch notification count',
    data: {}
  }, { status: 500 });
} 