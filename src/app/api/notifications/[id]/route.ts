import { notificationManager } from '@/server/managers/notificationManager';
import { ERROR, SUCCESS } from '@/shared/constants';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const id = params.id;
  
  if (!id) {
    return NextResponse.json({
      status: ERROR,
      message: 'Notification ID is required',
      data: {}
    }, { status: 400 });
  }
  
  const response: any = await notificationManager.deleteNotification({ id });
  
  if (response.status === SUCCESS) {
    return NextResponse.json({
      status: SUCCESS,
      message: SUCCESS,
      data: response.data
    }, { status: 200 });
  }
  
  return NextResponse.json({
    status: ERROR,
    message: response.message || 'Failed to delete notification',
    data: {}
  }, { status: 500 });
} 