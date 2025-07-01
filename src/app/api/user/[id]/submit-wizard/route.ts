import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/master/User.model';
import { connectDB } from '@/lib/mongoose';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 401 }
    );
  }

  try {
    const userId = params.id;
    const formData = await request.json();
    
    // Verify user has permission
    if (session.user._id !== userId && !session.user.roles?.includes('HR_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await connectDB();

    // Update user with submitted data
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        ...formData,
        'wizardStatus': 'submitted',
        'wizardSubmittedAt': new Date(),
        'wizardSubmittedBy': session.user._id
      },
      { 
        new: true,
        runValidators: true 
      }
    )
    .populate([
      'personalDetails',
      'employmentDetails',
      'visaDetails',
      'identification',
      'benefits',
      {
        path: 'employmentDetails.department',
        model: 'Department'
      },
      {
        path: 'employmentDetails.designation',
        model: 'Designation'
      },
      {
        path: 'employmentDetails.reportingTo',
        model: 'User',
        select: 'firstName lastName email'
      },
      {
        path: 'employmentDetails.employeeType',
        model: 'EmployeeType'
      },
      {
        path: 'visaDetails.visaType',
        model: 'VisaType'
      }
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Generate required PDFs here
    // await generateRequiredPdfs(user);

    return NextResponse.json({ 
      success: true, 
      user,
      message: 'Wizard submitted successfully' 
    });
  } catch (error: any) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to submit form',
        details: error.errors || null
      },
      { status: 500 }
    );
  }
}
