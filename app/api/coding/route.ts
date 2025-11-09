import { NextRequest, NextResponse } from 'next/server';
import { getCodingQuestions, createCodingQuestion } from '@/lib/actions/coding.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    const questions = await getCodingQuestions();
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching coding questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coding questions' },
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
    if (!questionData.text) {
      return NextResponse.json(
        { success: false, error: 'Question text is required' },
        { status: 400 }
      );
    }
    
    // Validate test cases
    if (!questionData.testCases || !Array.isArray(questionData.testCases) || questionData.testCases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one test case is required' },
        { status: 400 }
      );
    }
    
    // Ensure each test case has input and expectedOutput
    for (const testCase of questionData.testCases) {
      if (!testCase.input || !testCase.expectedOutput) {
        return NextResponse.json(
          { success: false, error: 'Each test case must have input and expectedOutput' },
          { status: 400 }
        );
      }
    }

    // Set type to 'code'
    questionData.type = 'code';

    const result = await createCodingQuestion(questionData);
    
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
    console.error('Error creating coding question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coding question' },
      { status: 500 }
    );
  }
}
