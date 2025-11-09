import { NextRequest, NextResponse } from 'next/server';
import { getCodingQuestionById, updateCodingQuestion, deleteCodingQuestion } from '@/lib/actions/coding.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const question = await getCodingQuestionById(questionId);
    
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Error fetching coding question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coding question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const questionId = params.id;
    const questionData = await request.json();
    
    // Check if question exists
    const existingQuestion = await getCodingQuestionById(questionId);
    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Validate test cases
    if (questionData.testCases) {
      if (!Array.isArray(questionData.testCases) || questionData.testCases.length === 0) {
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
    }
    
    // Ensure type is 'code'
    questionData.type = 'code';
    
    const result = await updateCodingQuestion(questionId, questionData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating coding question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coding question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const questionId = params.id;
    
    // Check if question exists
    const existingQuestion = await getCodingQuestionById(questionId);
    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    const result = await deleteCodingQuestion(questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting coding question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coding question' },
      { status: 500 }
    );
  }
}
