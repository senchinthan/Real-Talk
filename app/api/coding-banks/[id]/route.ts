import { NextRequest, NextResponse } from 'next/server';
import { 
  getCodingQuestionBankById, 
  updateCodingQuestionBank, 
  deleteCodingQuestionBank 
} from '@/lib/actions/questionBank.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;
    const bank = await getCodingQuestionBankById(bankId);
    
    if (!bank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: bank });
  } catch (error) {
    console.error('Error fetching coding question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coding question bank' },
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
    
    const bankId = params.id;
    const bankData = await request.json();
    
    // Check if bank exists
    const existingBank = await getCodingQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (bankData.name === '') {
      return NextResponse.json(
        { success: false, error: 'Bank name cannot be empty' },
        { status: 400 }
      );
    }
    
    const result = await updateCodingQuestionBank(bankId, bankData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating coding question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coding question bank' },
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
    
    // Check if bank exists
    const existingBank = await getCodingQuestionBankById(bankId);
    if (!existingBank) {
      return NextResponse.json(
        { success: false, error: 'Question bank not found' },
        { status: 404 }
      );
    }
    
    const result = await deleteCodingQuestionBank(bankId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting coding question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coding question bank' },
      { status: 500 }
    );
  }
}
