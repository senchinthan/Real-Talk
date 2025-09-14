import { NextRequest, NextResponse } from 'next/server';
import { createFeedback } from '@/lib/actions/general.action';

export async function POST(request: NextRequest) {
    try {
        const { interviewId, userId, transcript } = await request.json();
        
        console.log('API: Received feedback request for interview:', interviewId);
        console.log('API: User ID:', userId);
        console.log('API: Transcript length:', transcript?.length);
        
        if (!interviewId || !userId || !transcript) {
            console.error('API: Missing required parameters');
            return NextResponse.json({ 
                success: false, 
                error: 'Missing required parameters: interviewId, userId, or transcript' 
            }, { status: 400 });
        }
        
        const result = await createFeedback({
            interviewId,
            userId,
            transcript
        });
        
        console.log('API: Feedback creation result:', result);
        
        if (result.success) {
            return NextResponse.json({ 
                success: true, 
                feedbackId: result.feedbackId 
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                error: result.error || 'Failed to create feedback' 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('API: Error creating feedback:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
