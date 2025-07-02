import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';
import { HRMSFormTypes } from '@/models/hrms';

// POST /api/hrms/forms/[formType]/[id]/save-draft
export async function POST(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  // Get the params object first - await the entire object
  const resolvedParams = await params;
  const formType = resolvedParams.formType;
  const id = resolvedParams.id;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate form type
    if (!Object.values(HRMSFormTypes).includes(formType as any)) {
      return NextResponse.json(
        { success: false, message: 'Invalid form type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const result = await HRMSManager.saveDraft(
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
    console.error(`Error saving draft for ${formType}:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
