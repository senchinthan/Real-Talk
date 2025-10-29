import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { interviewId, roundId, userId, answers, submittedAt, score } = await request.json();

    if (!interviewId || !roundId || !userId || !answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Store the round answers
    const roundAnswerData = {
      interviewId,
      roundId,
      userId,
      answers,
      submittedAt: submittedAt || new Date().toISOString(),
      score: score || 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('roundAnswers').add(roundAnswerData);

    return NextResponse.json({
      success: true,
      answerId: docRef.id
    });

  } catch (error) {
    console.error('Error saving round answers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');
    const roundId = searchParams.get('roundId');
    const userId = searchParams.get('userId');

    if (!interviewId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let query = db.collection('roundAnswers')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId);

    if (roundId) {
      query = query.where('roundId', '==', roundId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const answers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      answers
    });

  } catch (error) {
    console.error('Error fetching round answers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

