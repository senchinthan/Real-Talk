"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Agent from '@/components/Agent';
import AptitudeRound from '@/components/AptitudeRound';
import CodingRound from '@/components/CodingRound';
import { Question, UserAnswer } from '@/types';

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
  userName
}) => {
  const router = useRouter();

  const handleComplete = (answers: UserAnswer[], score: number) => {
    // Redirect to feedback page
    router.push(`/companies/${templateId}/feedback`);
  };

  if (roundType === 'aptitude') {
    return (
      <AptitudeRound
        questions={questions}
        duration={duration}
        interviewId={interviewId}
        userId={userId}
        roundId={roundId}
        roundName={roundName}
        onComplete={handleComplete}
      />
    );
  }

  if (roundType === 'code') {
    return (
      <CodingRound
        questions={questions}
        duration={duration}
        interviewId={interviewId}
        userId={userId}
        roundId={roundId}
        roundName={roundName}
        onComplete={handleComplete}
      />
    );
  }

  if (roundType === 'voice' || roundType === 'text') {
    return (
      <Agent
        userName={userName || ''}
        userId={userId}
        interviewId={interviewId}
        type="interview"
        questions={typeof questions[0] === 'string' ? questions as string[] : (questions as Question[]).map(q => q.text)}
        roundId={roundId}
        roundName={roundName}
      />
    );
  }

  return null;
};

export default RoundInterviewWrapper;

