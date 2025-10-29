"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question, UserAnswer, TestCase } from '@/types';
import { isNewQuestionFormat, convertLegacyQuestions, mapLanguageToJudge0 } from '@/lib/utils';

interface CodingRoundProps {
  questions: Question[] | string[];
  duration: number; // in minutes
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  onComplete: (answers: UserAnswer[], score: number) => void;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: string;
  time: string;
  memory: string;
}

const CodingRound: React.FC<CodingRoundProps> = ({
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
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  // Convert questions to new format if needed
  const formattedQuestions: Question[] = isNewQuestionFormat(questions) 
    ? questions 
    : convertLegacyQuestions(questions);

  const currentQuestion = formattedQuestions[currentQuestionIndex];

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

  // Load saved code when question changes
  useEffect(() => {
    const savedAnswer = answers.find(a => a.questionId === currentQuestion.id);
    if (savedAnswer?.code) {
      setCode(savedAnswer.code);
    } else {
      setCode('');
    }
  }, [currentQuestionIndex, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    // Auto-save code
    const updatedAnswers = answers.filter(a => a.questionId !== currentQuestion.id);
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer: newCode,
      code: newCode,
      language: selectedLanguage
    };
    setAnswers([...updatedAnswers, newAnswer]);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    
    // Update current answer with new language
    const updatedAnswers = answers.map(a => 
      a.questionId === currentQuestion.id 
        ? { ...a, language }
        : a
    );
    setAnswers(updatedAnswers);
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/judge0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: mapLanguageToJudge0(selectedLanguage),
          stdin: currentQuestion.testCases?.[0]?.input || ''
        })
      });

      const result = await response.json();
      setExecutionResults([result]);
    } catch (error) {
      console.error('Error executing code:', error);
      setExecutionResults([{
        stdout: '',
        stderr: 'Error executing code. Please try again.',
        status: 'Error',
        time: '0',
        memory: '0'
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestAllCases = async () => {
    if (!code.trim() || !currentQuestion.testCases) return;

    setIsExecuting(true);
    const results: ExecutionResult[] = [];

    try {
      for (const testCase of currentQuestion.testCases) {
        const response = await fetch('/api/judge0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: code,
            language_id: mapLanguageToJudge0(selectedLanguage),
            stdin: testCase.input
          })
        });

        const result = await response.json();
        results.push(result);
      }
      setExecutionResults(results);
    } catch (error) {
      console.error('Error testing code:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < formattedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setExecutionResults([]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setExecutionResults([]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    // Calculate basic score based on test case results
    let score = 0;
    if (currentQuestion.testCases && executionResults.length > 0) {
      const passedTests = executionResults.filter((result, index) => {
        const testCase = currentQuestion.testCases![index];
        return result.stdout.trim() === testCase.expectedOutput.trim();
      }).length;
      score = Math.round((passedTests / currentQuestion.testCases.length) * 100);
    }

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

  const isLastQuestion = currentQuestionIndex === formattedQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' }
  ];

  if (isSubmitted) {
    return (
      <div className="text-center py-8 px-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Round Submitted!</h2>
        <p className="text-muted-foreground">Your code has been saved. You will receive feedback shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Statement */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Problem Statement</span>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {currentQuestion.difficulty || 'Medium'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-base sm:text-lg mb-4 text-white">{currentQuestion.text}</p>
              
              {currentQuestion.testCases && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-white">Test Cases:</h4>
                  <div className="space-y-3">
                    {currentQuestion.testCases.map((testCase, index) => (
                      <div key={index} className="bg-muted/20 p-3 rounded-lg border border-border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-white">Input:</span>
                            <pre className="mt-1 bg-background p-2 rounded border border-border text-white">
                              {testCase.input}
                            </pre>
                          </div>
                          <div>
                            <span className="font-medium text-white">Expected Output:</span>
                            <pre className="mt-1 bg-background p-2 rounded border border-border text-white">
                              {testCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Code Editor</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-1 border border-border rounded text-sm bg-background text-white"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 sm:h-96 border border-border rounded-lg overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Write your code here..."
                className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none bg-background text-white placeholder:text-muted-foreground"
                style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                onClick={handleRunCode}
                disabled={isExecuting || !code.trim()}
                variant="outline"
                className="border-border text-white hover:bg-muted"
              >
                {isExecuting ? 'Running...' : 'Run Code'}
              </Button>
              {currentQuestion.testCases && (
                <Button
                  onClick={handleTestAllCases}
                  disabled={isExecuting || !code.trim()}
                  variant="outline"
                  className="border-border text-white hover:bg-muted"
                >
                  Test All Cases
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Results */}
      {executionResults.length > 0 && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Execution Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executionResults.map((result, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">Test Case {index + 1}</span>
                    <Badge 
                      variant={result.status === 'Accepted' ? 'default' : 'destructive'}
                      className={result.status === 'Accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                    >
                      {result.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-white">Output:</span>
                      <pre className="mt-1 bg-background p-2 rounded border border-border text-white">
                        {result.stdout || '(no output)'}
                      </pre>
                    </div>
                    {result.stderr && (
                      <div>
                        <span className="font-medium text-white">Error:</span>
                        <pre className="mt-1 bg-red-500/10 p-2 rounded border border-red-500/20 text-red-400">
                          {result.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Time: {result.time}s</span>
                    <span>Memory: {result.memory}KB</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
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

        <Button
          onClick={handleSubmit}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Submit Round
        </Button>
      </div>
    </div>
  );
};

export default CodingRound;

