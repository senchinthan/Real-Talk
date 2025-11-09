import { NextRequest, NextResponse } from 'next/server';
import { loadQuestionsForRound } from '@/lib/actions/questionBank.action';

export async function POST(request: NextRequest) {
  try {
    const { round } = await request.json();
    
    if (!round) {
      return NextResponse.json(
        { success: false, error: 'Round data is required' },
        { status: 400 }
      );
    }

    // Load questions for the round
    const questions = await loadQuestionsForRound(round);
    
    return NextResponse.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error loading questions for round:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load questions for round' },
      { status: 500 }
    );
  }
}
