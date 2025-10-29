"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question, UserAnswer } from '@/types';
import { isNewQuestionFormat, convertLegacyQuestions, calculateAptitudeScore } from '@/lib/utils';

interface AptitudeRoundProps {
  questions: Question[] | string[];
  duration: number; // in minutes
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  onComplete: (answers: UserAnswer[], score: number) => void;
}

const AptitudeRound: React.FC<AptitudeRoundProps> = ({
  questions,
  duration,
  interviewId,
  userId,
  roundId,
  roundName,
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // Convert questions to new format if needed
  const formattedQuestions: Question[] = isNewQuestionFormat(questions) 
    ? questions 
    : convertLegacyQuestions(questions);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === questionId);
      const newAnswer: UserAnswer = { questionId, answer };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newAnswer;
        return updated;
      } else {
        return [...prev, newAnswer];
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < formattedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    const score = calculateAptitudeScore(answers, formattedQuestions);
    
    // Store answers in database
    try {
      await fetch('/api/round-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundId,
          userId,
          answers,
          submittedAt: new Date().toISOString(),
          score
        })
      });
    } catch (error) {
      console.error('Error saving answers:', error);
    }

    onComplete(answers, score);
  };

  const currentQuestion = formattedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === formattedQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  if (isSubmitted) {
    return (
      <div className="text-center py-8 px-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Round Submitted!</h2>
        <p className="text-muted-foreground">Your answers have been saved. You will receive feedback shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{roundName}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Question {currentQuestionIndex + 1} of {formattedQuestions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Time Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-1000"
          style={{ width: `${((currentQuestionIndex + 1) / formattedQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Display */}
      <Card className="mb-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>Question {currentQuestionIndex + 1}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentQuestion.points || 1} point{currentQuestion.points !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base sm:text-lg mb-6 text-white">{currentQuestion.text}</p>

          {/* MCQ Options */}
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={currentAnswer?.answer === index}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
                    className="w-4 h-4 text-primary bg-background border-border"
                  />
                  <span className="text-sm text-white">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Text Answer */}
          {currentQuestion.type === 'text' && (
            <textarea
              value={currentAnswer?.answer as string || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer here..."
              className="w-full h-32 p-3 border border-border rounded-md resize-none bg-background text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className="border-border text-white hover:bg-muted"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isLastQuestion}
            className="border-border text-white hover:bg-muted"
          >
            Next
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAllQuestions(!showAllQuestions)}
            className="border-border text-white hover:bg-muted"
          >
            {showAllQuestions ? 'Single View' : 'All Questions'}
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Submit Round
          </Button>
        </div>
      </div>

      {/* All Questions Overview */}
      {showAllQuestions && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">All Questions Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formattedQuestions.map((question, index) => {
                const answer = answers.find(a => a.questionId === question.id);
                return (
                  <div
                    key={question.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      index === currentQuestionIndex 
                        ? 'border-primary bg-primary/10' 
                        : answer 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-border bg-muted/20'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">Question {index + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        answer 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {answer ? 'Answered' : 'Not Answered'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {question.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AptitudeRound;

