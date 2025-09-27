import { NextRequest, NextResponse } from 'next/server';
import { createFeedback } from '@/lib/actions/general.action';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { interviewId, userId, transcript } = body;

        if (!interviewId || !userId || !transcript) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const result = await createFeedback({
            interviewId,
            userId,
            transcript
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in feedback API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

