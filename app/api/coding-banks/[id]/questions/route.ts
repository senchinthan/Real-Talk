import { NextRequest, NextResponse } from 'next/server';
import { 
  getCodingQuestionBankById, 
  addQuestionToCodingBank, 
  removeQuestionFromCodingBank 
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
    const existingBank = await getCodingQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
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
        { success: false, error: 'Coding questions must have at least one test case' },
        { status: 400 }
      );
    }
    
    // Validate each test case
    for (const testCase of questionData.testCases) {
      if (!testCase.input || !testCase.expectedOutput) {
        return NextResponse.json(
          { success: false, error: 'All test cases must have input and expected output' },
          { status: 400 }
        );
      }
    }
    
    const result = await addQuestionToCodingBank(bankId, questionData);
    
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
    console.error('Error adding question to coding bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add question to coding bank' },
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
    const existingBank = await getCodingQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    const result = await removeQuestionFromCodingBank(bankId, questionId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing question from coding bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove question from coding bank' },
      { status: 500 }
    );
  }
}
