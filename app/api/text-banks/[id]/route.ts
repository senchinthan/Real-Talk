import { NextRequest, NextResponse } from 'next/server';
import { 
  getTextQuestionBankById, 
  updateTextQuestionBank, 
  deleteTextQuestionBank 
} from '@/lib/actions/questionBank.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bank = await getTextQuestionBankById(params.id);
    
    if (!bank) {
      return NextResponse.json(
        { success: false, error: 'Text question bank not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: bank });
  } catch (error) {
    console.error('Error fetching text question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch text question bank' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    
    const bankData = await request.json();
    const result = await updateTextQuestionBank(params.id, bankData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating text question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update text question bank' },
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
    
    const result = await deleteTextQuestionBank(params.id);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting text question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete text question bank' },
      { status: 500 }
    );
  }
}
