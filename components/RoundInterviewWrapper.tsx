"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Agent from '@/components/Agent';
import AptitudeRound from '@/components/AptitudeRound';
import CodingRound from '@/components/CodingRound';

// Define types locally since importing from index.d.ts is causing issues
interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];           // For MCQ
  correctAnswer?: string | number; // For MCQ (index) or text
  testCases?: any[];       // For coding questions
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface UserAnswer {
  questionId: string;
  answer: string | number;
  code?: string;
  language?: string;
  isCorrect?: boolean;
  score?: number;
}

interface RoundInterviewWrapperProps {
  roundType: 'aptitude' | 'code' | 'voice' | 'text';
  questions: Question[] | string[];
  duration: number;
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  templateId: string;
  userName?: string;
  questionBankId?: string;
  questionCount?: number;
  isAdmin?: boolean;
}

const RoundInterviewWrapper: React.FC<RoundInterviewWrapperProps> = ({
  roundType,
  questions,
  duration,
  interviewId,
  userId,
  roundId,
  roundName,
  templateId,
  userName,
  questionBankId,
  questionCount,
  isAdmin = false
}) => {
  const router = useRouter();
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Log props for debugging
  useEffect(() => {
    console.log('RoundInterviewWrapper component mounted with props:', {
      interviewId,
      roundId,
      userId,
      templateId,
      roundType,
      questionsCount: questions?.length || 0,
      questionBankId,
      questionCount
    });
  }, []);

  // Load questions from the question bank if needed
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        
        // Special handling for voice interviews
        if (roundType === 'voice') {
          console.log('Loading voice interview questions from API');
          try {
            const voiceResponse = await fetch(`/api/company-voice/questions?templateId=${templateId}&roundId=${roundId}`);
            
            if (voiceResponse.ok) {
              const voiceData = await voiceResponse.json();
              if (voiceData.success && voiceData.questions && voiceData.questions.length > 0) {
                console.log(`Loaded ${voiceData.questions.length} voice questions from API`);
                // Convert string questions to Question objects
                const formattedQuestions = voiceData.questions.map((text: string, index: number) => ({
                  id: `voice-${roundId}-${index}`,
                  text,
                  type: 'text',
                  points: 1
                }));
                setLoadedQuestions(formattedQuestions);
                setIsLoading(false);
                return;
              }
            }
            console.log('Failed to load voice questions from API, falling back to standard questions');
          } catch (voiceError) {
            console.error('Error loading voice questions:', voiceError);
          }
        }
        
        // Create a round object with all the necessary properties
        const round = {
          id: roundId,
          name: roundName,
          type: roundType,
          questions: questions || [],
          // Use the props passed directly from the parent component
          questionBankId,
          questionCount,
          templateId, // Add templateId for voice questions
        };
        
        // Load questions for this round using the API endpoint
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ round }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setLoadedQuestions(data.data);
        } else {
          throw new Error(data.error || 'Failed to load questions');
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestions();
  }, [roundId, roundName, roundType, questions, questionBankId, questionCount, templateId]);

  const handleComplete = (answers: UserAnswer[], score: number) => {
    // Redirect to the specific round feedback page
    router.push(`/companies/${templateId}/round/${roundId}/feedback`);
  };
  
  // Show loading state
  if (isLoading) {
    return <div className="text-center py-8">Loading questions...</div>;
  }
  
  // Show error state
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (roundType === 'aptitude') {
    return (
      <AptitudeRound
        questions={loadedQuestions}
        duration={duration}
        interviewId={interviewId}
        userId={userId}
        roundId={roundId}
        roundName={roundName}
        templateId={templateId}
        onComplete={handleComplete}
      />
    );
  }

  if (roundType === 'code') {
    return (
      <CodingRound
        questions={loadedQuestions}
        duration={duration}
        interviewId={interviewId}
        userId={userId}
        templateId={templateId}
        roundId={roundId}
        roundName={roundName}
        isAdmin={isAdmin}
        onComplete={handleComplete}
      />
    );
  }

  if (roundType === 'voice' || roundType === 'text') {
    // For voice or text interviews, we need to extract just the question text
    let questionTexts: string[] = [];
    
    if (loadedQuestions && loadedQuestions.length > 0) {
      console.log(`Preparing ${loadedQuestions.length} questions for voice/text interview`);
      questionTexts = loadedQuestions.map(q => q.text);
    } else if (questions && questions.length > 0 && typeof questions[0] === 'string') {
      // If we have string questions directly from the API
      console.log(`Using ${questions.length} pre-loaded string questions for voice/text interview`);
      questionTexts = questions as string[];
    } else {
      console.log('No questions available for voice/text interview, will use defaults');
    }
    
    console.log('Voice/text interview questions:', questionTexts);
    
    return (
      <Agent
        userName={userName || ''}
        userId={userId}
        interviewId={interviewId}
        type="interview"
        questions={questionTexts}
        roundId={roundId}
        roundName={roundName}
        templateId={templateId}
      />
    );
  }

  return null;
};

export default RoundInterviewWrapper;

