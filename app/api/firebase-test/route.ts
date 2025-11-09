import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

type TestResults = {
  [key: string]: {
    exists?: boolean;
    empty?: boolean;
    count?: number;
    success: boolean;
    error?: string;
    message?: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase admin connection...');
    
    // Test collections
    const collections = ['companyTemplates', 'companyInterviews', 'roundAnswers', 'feedback'];
    const results: TestResults = {};
    
    for (const collection of collections) {
      try {
        console.log(`Testing collection: ${collection}`);
        const snapshot = await db.collection(collection).limit(1).get();
        results[collection] = {
          exists: true,
          empty: snapshot.empty,
          count: snapshot.size,
          success: true
        };
        console.log(`Collection ${collection} test successful: ${snapshot.empty ? 'Empty' : 'Has documents'}`);
      } catch (error: any) {
        console.error(`Error testing collection ${collection}:`, error);
        results[collection] = {
          exists: false,
          error: error?.message || 'Unknown error',
          success: false
        };
      }
    }
    
    // Test write operation with a test document
    try {
      console.log('Testing write operation...');
      const testDocRef = await db.collection('_test_').doc('firebase-test').set({
        timestamp: new Date().toISOString(),
        test: 'Firebase admin connection test'
      });
      results['write_test'] = {
        success: true,
        message: 'Write operation successful'
      };
      console.log('Write test successful');
      
      // Clean up test document
      await db.collection('_test_').doc('firebase-test').delete();
      console.log('Test document cleaned up');
    } catch (writeError: any) {
      console.error('Error testing write operation:', writeError);
      results['write_test'] = {
        success: false,
        error: writeError?.message || 'Unknown error'
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      firebase_project_id: process.env.FIREBASE_PROJECT_ID ? 'Configured' : 'Missing',
      firebase_client_email: process.env.FIREBASE_CLIENT_EMAIL ? 'Configured' : 'Missing',
      firebase_private_key: process.env.FIREBASE_PRIVATE_KEY ? 'Configured' : 'Missing',
      results
    });
  } catch (error: any) {
    console.error('Firebase test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Firebase test failed',
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
