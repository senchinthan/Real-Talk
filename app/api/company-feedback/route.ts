import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFeedback, updateCompanyFeedback } from '@/lib/actions/feedback.action';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received at /api/company-feedback');
    
    // Log the request body
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { interviewId, userId, templateId } = requestBody;

    // Validate required parameters
    const missingParams = [];
    if (!interviewId) missingParams.push('interviewId');
    if (!userId) missingParams.push('userId');
    if (!templateId) missingParams.push('templateId');
    
    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return NextResponse.json(
        { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` },
        { status: 400 }
      );
    }

    // Update company feedback
    console.log('Updating company feedback...');
    const result = await updateCompanyFeedback(interviewId, userId, templateId);

    if (result.success) {
      console.log(`Company feedback updated with ID: ${result.feedbackId}`);
      return NextResponse.json({
        success: true,
        feedbackId: result.feedbackId
      });
    } else {
      console.error(`Failed to update company feedback: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update company feedback' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating company feedback:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');
    const userId = searchParams.get('userId');

    if (!interviewId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: interviewId, userId' },
        { status: 400 }
      );
    }

    const feedback = await getCompanyFeedback(interviewId, userId);

    if (!feedback) {
      return NextResponse.json(
        { success: false, error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback
    });
  } catch (error: any) {
    console.error('Error fetching company feedback:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
