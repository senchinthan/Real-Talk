import { NextRequest, NextResponse } from 'next/server';
import { getAptitudeQuestionById, updateAptitudeQuestion, deleteAptitudeQuestion } from '@/lib/actions/aptitude.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const question = await getAptitudeQuestionById(questionId);
    
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Error fetching aptitude question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch aptitude question' },
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
    const existingQuestion = await getAptitudeQuestionById(questionId);
    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Validate MCQ questions have options and correctAnswer
    if (questionData.type === 'mcq' && (!questionData.options || questionData.correctAnswer === undefined)) {
      return NextResponse.json(
        { success: false, error: 'MCQ questions require options and correctAnswer' },
        { status: 400 }
      );
    }
    
    const result = await updateAptitudeQuestion(questionId, questionData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating aptitude question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update aptitude question' },
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
    const existingQuestion = await getAptitudeQuestionById(questionId);
    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    const result = await deleteAptitudeQuestion(questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting aptitude question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete aptitude question' },
      { status: 500 }
    );
  }
}
