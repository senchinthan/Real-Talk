import { NextRequest, NextResponse } from 'next/server';
import { addQuestionToTextBank, removeQuestionFromTextBank } from '@/lib/actions/questionBank.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(
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
    
    const questionData = await request.json();
    
    // Validate required fields
    if (!questionData.text) {
      return NextResponse.json(
        { success: false, error: 'Question text is required' },
        { status: 400 }
      );
    }
    
    const result = await addQuestionToTextBank(params.id, questionData);
    
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
    console.error('Error adding question to text bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add question to text bank' },
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
    
    const { questionId } = await request.json();
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    const result = await removeQuestionFromTextBank(params.id, questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing question from text bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove question from text bank' },
      { status: 500 }
    );
  }
}
