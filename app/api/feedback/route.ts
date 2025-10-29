import { NextRequest, NextResponse } from 'next/server';
import { createFeedback } from '@/lib/actions/general.action';
import { createRoundFeedback } from '@/lib/actions/company.action';
import { isNewQuestionFormat, convertLegacyQuestions, calculateAptitudeScore } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { interviewId, userId, transcript, roundId, roundName, answers, score } = body;

        if (!interviewId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Handle different round types
        if (roundId && roundName) {
            // Company interview round feedback
            const result = await createRoundFeedback({
                interviewId,
                userId,
                roundId,
                roundName,
                transcript: transcript || [],
                answers: answers || [],
                score: score || 0
            });

            return NextResponse.json(result);
        } else if (transcript) {
            // Regular interview feedback (voice-based)
            const result = await createFeedback({
                interviewId,
                userId,
                transcript
            });

            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid request format' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error in feedback API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

