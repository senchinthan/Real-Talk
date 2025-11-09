import { NextResponse } from 'next/server';
import { signOut } from '@/lib/actions/auth.action';

export async function POST() {
  try {
    const result = await signOut();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to sign out' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json({ success: false, message: 'An error occurred during sign out' }, { status: 500 });
  }
}
