import { NextRequest, NextResponse } from 'next/server';

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

if (!JUDGE0_API_KEY) {
  console.warn('JUDGE0_API_KEY not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const { source_code, language_id, stdin } = await request.json();

    if (!source_code || !language_id) {
      return NextResponse.json(
        { error: 'source_code and language_id are required' },
        { status: 400 }
      );
    }

    // Submit code for execution
    const submissionResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY || '',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code,
        language_id: parseInt(language_id),
        stdin: stdin || '',
        expected_output: '',
        cpu_time_limit: '5.0',
        memory_limit: 128000,
        wall_time_limit: '10.0'
      })
    });

    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text();
      console.error('Judge0 submission error:', errorText);
      return NextResponse.json(
        { error: 'Failed to submit code for execution' },
        { status: 500 }
      );
    }

    const submissionResult = await submissionResponse.json();
    const token = submissionResult.token;

    if (!token) {
      return NextResponse.json(
        { error: 'No token received from Judge0' },
        { status: 500 }
      );
    }

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let result;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!resultResponse.ok) {
        attempts++;
        continue;
      }

      result = await resultResponse.json();
      
      // Check if execution is complete
      if (result.status && result.status.id > 2) { // Status > 2 means completed
        break;
      }
      
      attempts++;
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Execution timeout' },
        { status: 408 }
      );
    }

    // Map Judge0 status to our format
    const statusMap: Record<number, string> = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error',
      8: 'Memory Limit Exceeded',
      9: 'Output Limit Exceeded',
      10: 'Internal Error'
    };

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: statusMap[result.status?.id] || 'Unknown',
      time: result.time || '0',
      memory: result.memory || '0',
      compile_output: result.compile_output || ''
    });

  } catch (error) {
    console.error('Judge0 API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token parameter is required' },
      { status: 400 }
    );
  }

  try {
    const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
      headers: {
        'X-RapidAPI-Key': JUDGE0_API_KEY || '',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });

    if (!resultResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch submission result' },
        { status: 500 }
      );
    }

    const result = await resultResponse.json();

    // Map Judge0 status to our format
    const statusMap: Record<number, string> = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error',
      8: 'Memory Limit Exceeded',
      9: 'Output Limit Exceeded',
      10: 'Internal Error'
    };

    return NextResponse.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: statusMap[result.status?.id] || 'Unknown',
      time: result.time || '0',
      memory: result.memory || '0',
      compile_output: result.compile_output || ''
    });

  } catch (error) {
    console.error('Judge0 API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

