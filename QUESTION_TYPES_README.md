# Question Types Implementation

This document describes the implementation of different question types for interview rounds.

## Overview

The system now supports three distinct round types:

1. **Aptitude** - Multiple choice and text questions with automatic scoring
2. **Coding** - Live code editor with Judge0 integration and AI review
3. **Behavioral** - Voice interview (existing implementation)

## New Components

### AptitudeRound Component

- Handles MCQ and text-based questions
- Timer functionality with auto-submit
- Progress tracking and navigation
- Automatic scoring based on correct answers
- All questions overview mode

### CodingRound Component

- Code editor with syntax highlighting
- Multiple programming language support
- Test case execution via Judge0 API
- Real-time code execution results
- AI-based code quality review

## API Routes

### `/api/judge0`

- POST: Submit code for execution
- GET: Fetch execution results
- Handles language mapping and error handling

### `/api/round-answers`

- POST: Save user answers for a round
- GET: Retrieve saved answers
- Supports different question types

### Updated `/api/feedback`

- Extended to handle aptitude and coding rounds
- AI-based feedback generation for different question types
- Automatic scoring and analysis

## Database Schema

### New Collections

- `roundAnswers`: Stores user answers for each round
- Extended `feedback` collection with round-specific data

### Data Structure

```typescript
interface UserAnswer {
  questionId: string;
  answer: string | number;
  code?: string;
  language?: string;
  isCorrect?: boolean;
  score?: number;
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# Judge0 API Configuration
JUDGE0_API_KEY=your_judge0_api_key_here
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

## Usage

### Creating Aptitude Rounds

```typescript
{
  id: "aptitude-round",
  name: "Aptitude Test",
  type: "aptitude",
  duration: 30,
  questions: [
    {
      id: "q1",
      text: "What is the time complexity of binary search?",
      type: "mcq",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctAnswer: 1,
      points: 1
    }
  ],
  passingScore: 70
}
```

### Creating Coding Rounds

```typescript
{
  id: "coding-round",
  name: "Coding Challenge",
  type: "code",
  duration: 45,
  questions: [
    {
      id: "c1",
      text: "Implement a function to find the longest common subsequence",
      type: "code",
      testCases: [
        {
          input: "ABCDGH\nAEDFHR",
          expectedOutput: "3",
          isHidden: false
        }
      ],
      points: 3,
      difficulty: "medium"
    }
  ],
  passingScore: 75
}
```

## Features

### Aptitude Rounds

- Multiple choice questions with automatic scoring
- Text questions with AI analysis
- Timer with auto-submit
- Progress tracking
- Question navigation

### Coding Rounds

- Live code editor with syntax highlighting
- Multiple programming languages
- Test case execution
- Real-time feedback
- Code quality analysis

### Behavioral Rounds

- Voice-based interviews (existing)
- AI conversation analysis
- Natural language processing

## Scoring

- **Aptitude**: Automatic scoring based on correct answers + AI analysis of text responses
- **Coding**: Test case execution results + AI code quality review
- **Behavioral**: Existing voice transcript analysis

## Future Enhancements

- Monaco Editor integration for better code editing experience
- Advanced AI feedback generation
- Performance analytics
- Custom question creation interface
- Bulk question import/export

