"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateAptitudeScore } from '@/lib/utils';
import { mapLanguageToJudge0 } from '@/lib/utils';
import { UserAnswer } from '@/types';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  testCases?: TestCase[];
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: string;
  time: string;
  memory: string;
}

interface CodingRoundProps {
  questions: Question[] | string[];
  duration: number; // in minutes
  interviewId: string;
  userId: string;
  templateId: string;
  roundId: string;
  roundName: string;
  isAdmin?: boolean;
  onComplete: (answers: UserAnswer[], score: number) => void;
}

const CodingRound: React.FC<CodingRoundProps> = ({
  questions,
  duration,
  interviewId,
  userId,
  templateId,
  roundId,
  roundName,
  isAdmin = false,
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Format questions if they're strings (question IDs)
  const [formattedQuestions, setFormattedQuestions] = useState<Question[]>([]);
  
  useEffect(() => {
    // Initialize formatted questions
    if (questions.length > 0) {
      if (typeof questions[0] === 'string') {
        // Fetch questions by IDs
        const fetchQuestions = async () => {
          const questionPromises = (questions as string[]).map(id => 
            fetch(`/api/questions/${id}`).then(res => res.json())
          );
          
          const fetchedQuestions = await Promise.all(questionPromises);
          setFormattedQuestions(fetchedQuestions.map(q => q.data));
        };
        
        fetchQuestions();
      } else {
        setFormattedQuestions(questions as Question[]);
      }
    }
    
    // Initialize answers array
    const initialAnswers = Array(questions.length).fill(null).map((_, i) => ({
      questionId: typeof questions[i] === 'string' ? questions[i] : questions[i].id,
      answer: '',
      isCorrect: false
    }));
    
    setAnswers(initialAnswers);
  }, [questions]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);
  
  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      answer: newCode
    };
    setAnswers(newAnswers);
  };
  
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };
  
  const handleRunCode = async () => {
    if (!code.trim()) return;
    
    setIsExecuting(true);
    
    try {
      const currentQuestion = formattedQuestions[currentQuestionIndex];
      const testCase = currentQuestion.testCases?.[0];
      
      if (!testCase) {
        console.error('No test cases found');
        return;
      }
      
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
      setExecutionResults([result]);
    } catch (error) {
      console.error('Error running code:', error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Helper function for string normalization
  const normalizeString = (str: string) => {
    if (!str) return '';
    
    return str
      .trim()
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n+/g, '\n')   // Collapse multiple newlines
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .replace(/["']/g, "'")   // Standardize quotes
      .replace(/\s*,\s*/g, ',') // Normalize commas
      .replace(/\s*\.\s*/g, '.') // Normalize periods
      .replace(/\s*:\s*/g, ':') // Normalize colons
      .replace(/\s*;\s*/g, ';') // Normalize semicolons
      .replace(/\s*\(\s*/g, '(') // Normalize parentheses
      .replace(/\s*\)\s*/g, ')') // Normalize parentheses
      .replace(/\s*\[\s*/g, '[') // Normalize brackets
      .replace(/\s*\]\s*/g, ']') // Normalize brackets
      .replace(/\s*\{\s*/g, '{') // Normalize braces
      .replace(/\s*\}\s*/g, '}'); // Normalize braces
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
        
        // Check if output matches expected output using our normalized comparison
        if (result.stdout) {
          const normalizedOutput = normalizeString(result.stdout);
          const normalizedExpected = normalizeString(testCase.expectedOutput);
          
          // Update the status based on our comparison
          if (normalizedOutput === normalizedExpected) {
            result.status = 'Accepted';
          } else {
            result.status = 'Wrong Answer';
          }
          
          // Log for debugging
          console.log('Test case output:', JSON.stringify(normalizedOutput));
          console.log('Test case expected:', JSON.stringify(normalizedExpected));
          console.log('Match:', normalizedOutput === normalizedExpected);
        }
        
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
        
        const normalizedOutput = normalizeString(result.stdout);
        const normalizedExpected = normalizeString(testCase.expectedOutput);
        
        // Check if normalized strings match
        const isMatch = normalizedOutput === normalizedExpected;
        
        // For debugging
        console.log('Test case', index + 1);
        console.log('Output:', JSON.stringify(normalizedOutput));
        console.log('Expected:', JSON.stringify(normalizedExpected));
        console.log('Match:', isMatch);
        
        return isMatch;
      }).length;
      score = Math.round((passedTests / currentQuestion.testCases.length) * 100);
    }

    // Store answers in database
    try {
      // Save answers
      const answersResponse = await fetch('/api/round-answers', {
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
      
      const answersData = await answersResponse.json();
      console.log('Round answers saved:', answersData);
      
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
          roundType: 'code',
          answers,
          score
        })
      });
      
      const feedbackData = await feedbackResponse.json();
      console.log('Round feedback created:', feedbackData);
      
      // Mark round as complete
      const completeResponse = await fetch('/api/round-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          roundId
        })
      });
      
      const completeData = await completeResponse.json();
      console.log('Round marked complete:', completeData);
      
      // Call the onComplete callback to trigger redirection
      onComplete(answers, score);
    } catch (error) {
      console.error('Error saving answers or creating feedback:', error);
    } 
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

  // Check if questions are loaded
  if (formattedQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  const currentQuestion = formattedQuestions[currentQuestionIndex];

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
                    {currentQuestion.testCases
                      .filter(testCase => !testCase.isHidden) // Only show non-hidden test cases
                      .map((testCase, index) => (
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
                      {currentQuestion.testCases.some(tc => tc.isHidden) && (
                        <div className="text-sm text-muted-foreground italic">
                          Note: There are additional hidden test cases that will be used for evaluation.
                        </div>
                      )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Execution Results</CardTitle>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground cursor-pointer" htmlFor="debug-mode">
                  Admin Debug Mode
                </label>
                <input 
                  type="checkbox" 
                  id="debug-mode" 
                  checked={debugMode} 
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executionResults.map((result, index) => {
                // Check if this test case is hidden
                const isHidden = currentQuestion.testCases && currentQuestion.testCases[index]?.isHidden;
                
                // If it's hidden and user is not admin, don't show details
                const showDetails = !isHidden || isAdmin;
                
                return (
                  <div key={index} className="border border-border rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">
                        {isHidden ? `Hidden Test Case ${index + 1}` : `Test Case ${index + 1}`}
                      </span>
                      {currentQuestion.testCases && (
                        <Badge 
                          variant="default"
                          className={(() => {
                            // Perform comparison directly here
                            if (!result.stdout) return 'bg-red-500/20 text-red-400';
                            
                            const normalizedOutput = normalizeString(result.stdout);
                            const normalizedExpected = normalizeString(currentQuestion.testCases[index].expectedOutput);
                            const isMatch = normalizedOutput === normalizedExpected;
                            
                            return isMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
                          })()}
                        >
                          {(() => {
                            if (!result.stdout) return 'Error';
                            
                            const normalizedOutput = normalizeString(result.stdout);
                            const normalizedExpected = normalizeString(currentQuestion.testCases[index].expectedOutput);
                            const isMatch = normalizedOutput === normalizedExpected;
                            
                            return isMatch ? 'Accepted' : 'Wrong Answer';
                          })()}
                        </Badge>
                      )}
                    </div>
                    
                    {showDetails ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-white">Your Output:</span>
                            <pre className="mt-1 bg-background p-2 rounded border border-border text-white overflow-auto max-h-40">
                              {result.stdout || '(no output)'}
                            </pre>
                          </div>
                          {currentQuestion.testCases && (
                            <div>
                              <span className="font-medium text-white">Expected Output:</span>
                              <pre className="mt-1 bg-background p-2 rounded border border-border text-white overflow-auto max-h-40">
                                {currentQuestion.testCases[index]?.expectedOutput || '(no expected output)'}
                              </pre>
                            </div>
                          )}
                        </div>
                        
                        {result.stderr && (
                          <div className="mt-3">
                            <span className="font-medium text-white">Error:</span>
                            <pre className="mt-1 bg-red-500/10 p-2 rounded border border-red-500/20 text-red-400 overflow-auto max-h-40">
                              {result.stderr}
                            </pre>
                          </div>
                        )}
                        
                        {/* Comparison details */}
                        <div className="mt-3 p-2 rounded bg-gray-800/50 text-xs">
                          <div className="font-medium text-white mb-1">Comparison Details:</div>
                          <div className="text-muted-foreground">
                            <span>• Whitespace and line endings are normalized for comparison</span><br/>
                            <span>• Quotes are standardized</span><br/>
                            <span>• Case sensitivity is preserved</span>
                          </div>
                          
                          {isAdmin && debugMode && currentQuestion.testCases && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <div className="font-medium text-white mb-1">Character-by-Character Comparison:</div>
                              {(() => {
                                if (!result.stdout) return <span className="text-red-400">No output to compare</span>;
                                
                                const output = result.stdout.trim();
                                const expected = currentQuestion.testCases[index].expectedOutput.trim();
                                
                                // Show character codes for the first few characters
                                const outputChars = output.slice(0, 20).split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ');
                                const expectedChars = expected.slice(0, 20).split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ');
                                
                                // Find the first difference
                                let firstDiffPos = -1;
                                const minLength = Math.min(output.length, expected.length);
                                for (let i = 0; i < minLength; i++) {
                                  if (output[i] !== expected[i]) {
                                    firstDiffPos = i;
                                    break;
                                  }
                                }
                                
                                return (
                                  <div>
                                    <div><span className="text-green-400">Your output chars:</span> {outputChars}{output.length > 20 ? '...' : ''}</div>
                                    <div><span className="text-blue-400">Expected chars:</span> {expectedChars}{expected.length > 20 ? '...' : ''}</div>
                                    <div className="mt-1">
                                      <span className="text-yellow-400">Length comparison:</span> Your output: {output.length} chars, Expected: {expected.length} chars
                                    </div>
                                    {firstDiffPos >= 0 && (
                                      <div className="mt-1">
                                        <span className="text-red-400">First difference at position {firstDiffPos}:</span><br/>
                                        Your output: '{output[firstDiffPos]}' (char code: {output.charCodeAt(firstDiffPos)})<br/>
                                        Expected: '{expected[firstDiffPos]}' (char code: {expected.charCodeAt(firstDiffPos)})
                                      </div>
                                    )}
                                    <div className="mt-2">
                                      <div className="font-medium text-white mb-1">Normalized Comparison:</div>
                                      <div><span className="text-green-400">Your normalized:</span> '{normalizeString(result.stdout)}'</div>
                                      <div><span className="text-blue-400">Expected normalized:</span> '{normalizeString(currentQuestion.testCases[index].expectedOutput)}'</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Time: {result.time}s</span>
                          <span>Memory: {result.memory}KB</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        This is a hidden test case. Details are not shown, but the result is used for evaluation.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrevious}
          disabled={isFirstQuestion || isExecuting}
          variant="outline"
          className="border-border text-white hover:bg-muted"
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={isExecuting}
              variant="outline"
              className="border-border text-white hover:bg-muted"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isExecuting || isSubmitted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Submit Round
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingRound;
