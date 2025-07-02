import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';
import { HRMSFormTypes } from '@/models/hrms';

// GET /api/hrms/forms/[formType]/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { formType, id } = await params;

    // Validate form type
    if (!Object.values(HRMSFormTypes).includes(formType as any)) {
      return NextResponse.json(
        { success: false, message: 'Invalid form type' },
        { status: 400 }
      );
    }

    const result = await HRMSManager.getFormById(formType, id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error: any) {
    console.error(`Error fetching form:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/hrms/forms/[formType]/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { formType, id } = await params;

    // Validate form type
    if (!Object.values(HRMSFormTypes).includes(formType as any)) {
      return NextResponse.json(
        { success: false, message: 'Invalid form type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const result = await HRMSManager.updateForm(
      formType,
      id,
      body,
      session.user.id
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error updating form:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/hrms/forms/[formType]/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { formType, id } = await params;

    // Validate form type
    if (!Object.values(HRMSFormTypes).includes(formType as any)) {
      return NextResponse.json(
        { success: false, message: 'Invalid form type' },
        { status: 400 }
      );
    }

    const result = await HRMSManager.deleteForm(
      formType,
      id,
      session.user.id
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error deleting form:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}