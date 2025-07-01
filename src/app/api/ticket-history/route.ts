// src/app/api/ticket-history/route.ts
import { ticketHistoryManager } from '@/server/managers/ticketHistoryManager';
import { ERROR, SUCCESS } from '@/shared/constants';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import * as models from '@/models';
import mongoose from 'mongoose';

// Initialize models
Object.values(models).forEach(model => {
  const modelName = (model as any).modelName;
  if (modelName && !mongoose.models[modelName]) {
    ;(model as any).init();
  }
});

export async function GET(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect();

  const searchParams = new URL(request.url).searchParams;

  // Get history by ticket ID
  const ticketId = searchParams.get('ticketId');
  if (ticketId) {
    const response = await ticketHistoryManager.getTicketHistoryByTicketId(ticketId);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  }

  // If no ticketId provided, return error
  return NextResponse.json(
    { status: 'ERROR', message: 'Ticket ID is required', data: {} },
    { status: 400 }
  );
}