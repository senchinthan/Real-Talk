"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Question, UserAnswer } from '@/types';
import { isNewQuestionFormat, convertLegacyQuestions, calculateAptitudeScore } from '@/lib/utils';

interface AptitudeRoundProps {
  questions: Question[] | string[];
  duration: number; // in minutes
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  templateId: string; // Add templateId
  onComplete: (answers: UserAnswer[], score: number) => void;
}

const AptitudeRound: React.FC<AptitudeRoundProps> = ({
  questions,
  duration,
  interviewId,
  userId,
  roundId,
  roundName,
  templateId,
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // Log props for debugging
  useEffect(() => {
    console.log('AptitudeRound component mounted with props:', {
      interviewId,
      roundId,
      userId,
      templateId,
      questionsCount: questions?.length || 0
    });
  }, []);

  // Convert questions to new format if needed
  const formattedQuestions: Question[] = questions && questions.length > 0
    ? isNewQuestionFormat(questions)
      ? questions as Question[]
      : convertLegacyQuestions(questions as string[])
    : []; // Handle empty questions array

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
    
    console.log('Submitting answers for round:', roundId, 'in interview:', interviewId, 'for template:', templateId);
    console.log('User ID:', userId);
    console.log('Answers:', answers);
    
    setIsSubmitted(true);
    const score = calculateAptitudeScore(answers, formattedQuestions);
    
    // Store answers in database and create feedback
    try {
      // Save the answers
      const response = await fetch('/api/round-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundId,
          userId,
          templateId,
          answers,
          submittedAt: new Date().toISOString(),
          score
        })
      });
      
      const responseData = await response.json();
      console.log('Round answers API response:', responseData);
      
      // Create round feedback
      const feedbackResponse = await fetch('/api/round-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundId,
          userId,
          templateId,
          roundName,
          roundType: 'aptitude',
          answers,
          score
        })
      });
      
      const feedbackData = await feedbackResponse.json();
      console.log('Round feedback API response:', feedbackData);
      
      // Mark the round as complete
      await fetch('/api/round-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundId
        })
      });
      
      console.log(`Round ${roundId} marked as complete for interview ${interviewId}`);
    } catch (error) {
      console.error('Error saving answers or marking round complete:', error);
    }

    onComplete(answers, score);
  };

  // Check if formattedQuestions is empty
  if (formattedQuestions.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <h2 className="text-2xl font-bold mb-4 text-white">No Questions Available</h2>
        <p className="text-muted-foreground">There are no questions available for this round.</p>
      </div>
    );
  }

  const currentQuestion = formattedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === formattedQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentAnswer = currentQuestion ? answers.find(a => a.questionId === currentQuestion.id) : undefined;

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
      {/* Timer and Question Counter */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-white/10 to-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
        <div>
          <p className="text-lg sm:text-xl font-semibold text-white">
            Question <span className="text-primary">{currentQuestionIndex + 1}</span> of {formattedQuestions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs sm:text-sm text-white/70">Time Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2.5 mb-6 backdrop-blur-sm border border-white/20">
        <div 
          className="bg-gradient-to-r from-primary/80 to-primary h-2.5 rounded-full transition-all duration-1000 shadow-sm shadow-primary/20"
          style={{ width: `${((currentQuestionIndex + 1) / formattedQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Display */}
      <Card className="mb-6 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-white">
            <span>Question {currentQuestionIndex + 1}</span>
            {currentQuestion && (
              <span className="text-sm font-normal text-white/70">
                {currentQuestion.points || 1} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion ? (
            <>
              <p className="text-base sm:text-lg mb-6 text-white font-medium">{currentQuestion.text}</p>

              {/* MCQ Options */}
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg transition-all duration-200 ${currentAnswer?.answer === index 
                        ? 'bg-white/20 border border-white/30' 
                        : 'hover:bg-white/10 border border-white/10'}`}
                      onClick={() => handleAnswerChange(currentQuestion.id, index)}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${currentAnswer?.answer === index 
                        ? 'border-primary' 
                        : 'border-white/50'}`}>
                        {currentAnswer?.answer === index && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm text-white">{option}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Answer */}
              {currentQuestion.type === 'text' && (
                <textarea
                  value={currentAnswer?.answer as string || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Enter your answer here..."
                  className="w-full h-32 p-4 border border-white/20 rounded-lg resize-none bg-white/5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </>
          ) : (
            <p className="text-center text-white/70">Question not available</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={isLastQuestion}
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
          >
            Next
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAllQuestions(!showAllQuestions)}
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
          >
            {showAllQuestions ? 'Single View' : 'All Questions'}
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-primary/90 to-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200"
          >
            Submit Round
          </Button>
        </div>
      </div>

      {/* All Questions Overview */}
      {showAllQuestions && (
        <Card className="mt-6 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-white/20 shadow-lg">
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
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                      index === currentQuestionIndex 
                        ? 'bg-gradient-to-b from-primary/20 to-primary/10 border border-primary/30 shadow-md shadow-primary/10' 
                        : answer 
                          ? 'bg-gradient-to-b from-green-500/20 to-green-500/10 border border-green-500/30 shadow-md shadow-green-500/10' 
                          : 'bg-gradient-to-b from-white/10 to-white/5 border border-white/20 hover:border-white/30'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">Question {index + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        answer 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-white/10 text-white/70 border border-white/20'
                      }`}>
                        {answer ? 'Answered' : 'Not Answered'}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2">
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
