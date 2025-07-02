import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';
import { HRMSFormTypes } from '@/models/hrms';

// POST /api/hrms/forms/[formType]/[id]/submit
export async function POST(
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

    const result = await HRMSManager.submitForm(
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
    console.error(`Error submitting form:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}