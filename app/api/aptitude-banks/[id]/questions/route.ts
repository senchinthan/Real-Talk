import { NextRequest, NextResponse } from 'next/server';
import { 
  getAptitudeQuestionBankById, 
  addQuestionToAptitudeBank, 
  removeQuestionFromAptitudeBank 
} from '@/lib/actions/questionBank.action';
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
    
    const bankId = params.id;
    
    // Check if bank exists
    const existingBank = await getAptitudeQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
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
    
    // Validate MCQ questions
    if (questionData.type === 'mcq') {
      if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length < 2) {
        return NextResponse.json(
          { success: false, error: 'MCQ questions must have at least 2 options' },
          { status: 400 }
        );
      }
      
      if (questionData.correctAnswer === undefined || questionData.correctAnswer === null) {
        return NextResponse.json(
          { success: false, error: 'MCQ questions must have a correct answer' },
          { status: 400 }
        );
      }
    }
    
    const result = await addQuestionToAptitudeBank(bankId, questionData);
    
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
    console.error('Error adding question to aptitude bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add question to aptitude bank' },
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
    
    const bankId = params.id;
    const { questionId } = await request.json();
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    // Check if bank exists
    const existingBank = await getAptitudeQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    const result = await removeQuestionFromAptitudeBank(bankId, questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing question from aptitude bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove question from aptitude bank' },
      { status: 500 }
    );
  }
}
