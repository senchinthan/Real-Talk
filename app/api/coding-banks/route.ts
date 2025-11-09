import { NextRequest, NextResponse } from 'next/server';
import { getCodingQuestionBanks, createCodingQuestionBank } from '@/lib/actions/questionBank.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET() {
  try {
    const banks = await getCodingQuestionBanks();
    return NextResponse.json({ success: true, data: banks });
  } catch (error) {
    console.error('Error fetching coding question banks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coding question banks' },
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

    const bankData = await request.json();
    
    // Validate required fields
    if (!bankData.name) {
      return NextResponse.json(
        { success: false, error: 'Bank name is required' },
        { status: 400 }
      );
    }

    const result = await createCodingQuestionBank(bankData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          bankId: result.bankId
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating coding question bank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coding question bank' },
      { status: 500 }
    );
  }
}
