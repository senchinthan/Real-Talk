import { NextRequest, NextResponse } from 'next/server';
import { 
  getTextQuestionBankById,
  getQuestionById,
  updateQuestion,
  removeQuestionFromTextBank 
} from '@/lib/actions/questionBank.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const bankId = params.id;
    const questionId = params.questionId;
    
    // Check if bank exists
    const existingBank = await getTextQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    // Get the question
    const question = await getQuestionById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Check if question belongs to this bank
    if (!existingBank.questionIds.includes(questionId)) {
      return NextResponse.json(
        { success: false, error: 'Question does not belong to this bank' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Error getting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bankId = params.id;
    const questionId = params.questionId;
    
    // Check if bank exists
    const existingBank = await getTextQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    // Check if question exists and belongs to this bank
    if (!existingBank.questionIds.includes(questionId)) {
      return NextResponse.json(
        { success: false, error: 'Question does not belong to this bank' },
        { status: 400 }
      );
    }
    
    const questionData = await request.json();
    
    // Validate required fields
    if (!questionData.text || !questionData.type) {
      return NextResponse.json(
        { success: false, error: 'Question text and type are required' },
        { status: 400 }
      );
    }
    
    // Update the question
    const result = await updateQuestion(questionId, questionData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Question updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bankId = params.id;
    const questionId = params.questionId;
    
    // Check if bank exists
    const existingBank = await getTextQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    // Check if question belongs to this bank
    if (!existingBank.questionIds.includes(questionId)) {
      return NextResponse.json(
        { success: false, error: 'Question does not belong to this bank' },
        { status: 400 }
      );
    }
    
    const result = await removeQuestionFromTextBank(bankId, questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
