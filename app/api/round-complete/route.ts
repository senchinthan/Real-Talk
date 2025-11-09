import { NextRequest, NextResponse } from 'next/server';
import { markRoundComplete } from '@/lib/actions/company.action';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received at /api/round-complete');
    
    // Log the request body
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { interviewId, roundId } = requestBody;

    // Validate required parameters
    const missingParams = [];
    if (!interviewId) missingParams.push('interviewId');
    if (!roundId) missingParams.push('roundId');
    
    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return NextResponse.json(
        { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`Attempting to mark round ${roundId} as complete for interview ${interviewId}...`);
    
    // Mark the round as complete
    try {
      const result = await markRoundComplete(interviewId, roundId);
      
      console.log('markRoundComplete result:', result);
      
      if (result.success) {
        console.log(`Round ${roundId} successfully marked as complete for interview ${interviewId}`);
        return NextResponse.json({
          success: true,
          message: `Round ${roundId} marked as complete for interview ${interviewId}`
        });
      } else {
        console.error(`Failed to mark round as complete: ${result.error}`);
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to mark round as complete' },
          { status: 400 }
        );
      }
    } catch (actionError: any) {
      console.error('Error in markRoundComplete action:', actionError);
      return NextResponse.json(
        { success: false, error: `Action error: ${actionError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error marking round as complete:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
