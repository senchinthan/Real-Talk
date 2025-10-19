import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyInterviewsByUserId, getRoundFeedback, getCumulativeFeedback } from '@/lib/actions/company.action';

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { templateId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const roundId = url.searchParams.get('roundId');
    const type = url.searchParams.get('type'); // 'round' or 'cumulative'

    // Get user's interview for this template
    const userInterviews = await getCompanyInterviewsByUserId(user.id);
    const userInterview = userInterviews.find(interview => interview.templateId === templateId);

    if (!userInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    if (type === 'round' && roundId) {
      // Get specific round feedback
      const roundFeedback = await getRoundFeedback(userInterview.id, roundId, user.id);
      
      if (!roundFeedback) {
        return NextResponse.json(
          { success: false, error: 'Round feedback not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: roundFeedback
      });
    } else if (type === 'cumulative') {
      // Get cumulative feedback
      const cumulativeFeedback = await getCumulativeFeedback(userInterview.id, user.id);
      
      return NextResponse.json({
        success: true,
        data: cumulativeFeedback
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { templateId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { interviewId, roundId, roundName, transcript } = body;

    if (!interviewId || !roundId || !roundName || !transcript) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the interview belongs to the user and template
    const userInterviews = await getCompanyInterviewsByUserId(user.id);
    const userInterview = userInterviews.find(interview => 
      interview.id === interviewId && interview.templateId === templateId
    );

    if (!userInterview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found or access denied' },
        { status: 404 }
      );
    }

    // Call the existing feedback API with round information
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interviewId,
        userId: user.id,
        transcript,
        roundId,
        roundName
      })
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          feedbackId: result.feedbackId
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating round feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create round feedback' },
      { status: 500 }
    );
  }
}
