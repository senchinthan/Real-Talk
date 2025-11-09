import { NextRequest, NextResponse } from 'next/server';
import { createRoundFeedback, getRoundFeedback } from '@/lib/actions/feedback.action';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received at /api/round-feedback');
    
    // Log the request body
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { interviewId, userId, templateId, roundId, roundName, roundType, answers, score } = requestBody;

    // Validate required parameters
    const missingParams = [];
    if (!interviewId) missingParams.push('interviewId');
    if (!userId) missingParams.push('userId');
    if (!templateId) missingParams.push('templateId');
    if (!roundId) missingParams.push('roundId');
    if (!roundName) missingParams.push('roundName');
    if (!roundType) missingParams.push('roundType');
    if (!answers) missingParams.push('answers');
    if (score === undefined) missingParams.push('score');
    
    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return NextResponse.json(
        { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` },
        { status: 400 }
      );
    }

    // Create round feedback
    console.log('Creating round feedback...');
    const result = await createRoundFeedback({
      interviewId,
      userId,
      templateId,
      roundId,
      roundName,
      roundType,
      answers,
      score
    });

    if (result.success) {
      console.log(`Round feedback ${result.isUpdate ? 'updated' : 'created'} with ID: ${result.feedbackId}`);
      return NextResponse.json({
        success: true,
        feedbackId: result.feedbackId,
        isUpdate: result.isUpdate
      });
    } else {
      console.error(`Failed to create round feedback: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create round feedback' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating round feedback:', error);
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
    const roundId = searchParams.get('roundId');
    const userId = searchParams.get('userId');

    if (!interviewId || !roundId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: interviewId, roundId, userId' },
        { status: 400 }
      );
    }

    const feedback = await getRoundFeedback(interviewId, roundId, userId);

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
    console.error('Error fetching round feedback:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
