import { NextRequest, NextResponse } from 'next/server';
import { getAptitudeQuestions, createAptitudeQuestion } from '@/lib/actions/aptitude.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    const questions = await getAptitudeQuestions();
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching aptitude questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch aptitude questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const questionData = await request.json();
    
    // Validate required fields
    if (!questionData.text || !questionData.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate MCQ questions have options and correctAnswer
    if (questionData.type === 'mcq' && (!questionData.options || questionData.correctAnswer === undefined)) {
      return NextResponse.json(
        { success: false, error: 'MCQ questions require options and correctAnswer' },
        { status: 400 }
      );
    }

    const result = await createAptitudeQuestion(questionData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          questionId: result.questionId
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating aptitude question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create aptitude question' },
      { status: 500 }
    );
  }
}
