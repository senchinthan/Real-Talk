import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received at /api/round-answers');
    
    // Log the request body
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { interviewId, roundId, userId, templateId, answers, submittedAt, score } = requestBody;

    // Validate required parameters
    const missingParams = [];
    if (!interviewId) missingParams.push('interviewId');
    if (!roundId) missingParams.push('roundId');
    if (!userId) missingParams.push('userId');
    if (!answers) missingParams.push('answers');
    
    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return NextResponse.json(
        { success: false, error: `Missing required parameters: ${missingParams.join(', ')}` },
        { status: 400 }
      );
    }

    // Store the round answers
    const roundAnswerData = {
      interviewId,
      roundId,
      userId,
      templateId,
      answers,
      submittedAt: submittedAt || new Date().toISOString(),
      score: score || 0,
      createdAt: new Date().toISOString()
    };

    console.log('Checking for existing round answers...');
    
    try {
      // Check if there are existing answers for this user, interview, and round
      const existingAnswersQuery = await db.collection('roundAnswers')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .where('roundId', '==', roundId)
        .get();
      
      let answerId;
      
      if (!existingAnswersQuery.empty) {
        // Found existing answers, update them
        const existingDoc = existingAnswersQuery.docs[0];
        answerId = existingDoc.id;
        
        console.log(`Found existing answers with ID: ${answerId}, updating...`);
        
        // Update the existing document
        await db.collection('roundAnswers').doc(answerId).update({
          answers,
          submittedAt: submittedAt || new Date().toISOString(),
          score: score || 0,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated existing answers with ID: ${answerId}`);
      } else {
        // No existing answers found, create new document
        console.log('No existing answers found, creating new document...');
        const docRef = await db.collection('roundAnswers').add(roundAnswerData);
        answerId = docRef.id;
        console.log('Round answers saved successfully with ID:', answerId);
      }
      
      return NextResponse.json({
        success: true,
        answerId,
        isUpdate: !existingAnswersQuery.empty
      });
    } catch (firestoreError: any) {
      console.error('Firestore error while saving round answers:', firestoreError);
      return NextResponse.json(
        { success: false, error: `Firestore error: ${firestoreError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

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

