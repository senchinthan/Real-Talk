"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, Edit } from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'code';
  testCases?: TestCase[];
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface CodingQuestionBank {
  id: string;
  name: string;
  description: string;
  type: 'coding';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionIds: string[];
  questions?: Question[];
  isActive: boolean;
}

interface CodingBankQuestionsProps {
  params: Promise<{ id: string }>;
}

const CodingBankQuestionsPage = ({ params: paramsPromise }: CodingBankQuestionsProps) => {
  const params = use(paramsPromise);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bank, setBank] = useState<CodingQuestionBank | null>(null);
  
  // New question form state
  const [questionText, setQuestionText] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false }
  ]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const response = await fetch(`/api/coding-banks/${params.id}?includeQuestions=true`);
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
        } else {
          console.error('Failed to fetch question bank');
          router.push('/admin/coding-banks');
        }
      } catch (error) {
        console.error('Error fetching question bank:', error);
        router.push('/admin/coding-banks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [params.id, router]);

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length <= 1) {
      alert('Coding questions must have at least one test case');
      return;
    }
    
    const newTestCases = [...testCases];
    newTestCases.splice(index, 1);
    setTestCases(newTestCases);
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }
    
    // Validate test cases
    if (testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      alert('All test cases must have input and expected output');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const questionData = {
        text: questionText,
        type: 'code' as const,
        testCases,
        difficulty,
        points
      };
      
      const response = await fetch(`/api/coding-banks/${params.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData)
      });
      
      if (response.ok) {
        // Reset form
        setQuestionText('');
        setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
        
        // Refresh bank data
        const bankResponse = await fetch(`/api/coding-banks/${params.id}?includeQuestions=true`);
        if (bankResponse.ok) {
          const data = await bankResponse.json();
          setBank(data.data);
        }
        
        alert('Question added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the bank?')) return;
    
    try {
      const response = await fetch(`/api/coding-banks/${params.id}/questions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId })
      });
      
      if (response.ok) {
        // Refresh bank data
        const bankResponse = await fetch(`/api/coding-banks/${params.id}?includeQuestions=true`);
        if (bankResponse.ok) {
          const data = await bankResponse.json();
          setBank(data.data);
        } else {
          // Fallback to client-side filtering if fetch fails
          setBank(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              questionIds: prev.questionIds.filter(id => id !== questionId),
              questions: prev.questions?.filter(q => q.id !== questionId)
            };
          });
        }
      } else {
        alert('Failed to remove question');
      }
    } catch (error) {
      console.error('Error removing question:', error);
      alert('Error removing question');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading question bank...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Question Bank Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested question bank could not be found.</p>
          <Button asChild>
            <Link href="/admin/coding-banks">Back to Question Banks</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/coding-banks">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{bank.name}</h1>
            <p className="text-muted-foreground">{bank.description}</p>
          </div>
        </div>

        {/* Current Questions */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-white">Questions in this Bank</CardTitle>
              <CardDescription>
                {bank.questionIds.length} question{bank.questionIds.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-border text-white hover:bg-muted"
            >
              <Link href={`/admin/coding-banks/${params.id}/view-questions`}>
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="max-h-[250px] overflow-y-auto">
            {bank.questions && bank.questions.length > 0 ? (
              <div className="space-y-4">
                {bank.questions.slice(0, 2).map((question) => (
                  <div key={question.id} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <p className="text-white mb-2">{question.text}</p>
                        
                        {question.testCases && (
                          <div className="ml-4 mt-2">
                            <p className="text-sm text-muted-foreground mb-1">
                              {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''}
                              {question.testCases.some(tc => tc.isHidden) && ' (includes hidden test cases)'}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.testCases.slice(0, 1).map((testCase, index) => (
                                <div key={index} className="text-xs bg-muted/20 p-2 rounded">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="font-medium text-white">Test {index + 1}</span>
                                    {testCase.isHidden && (
                                      <span className="text-muted-foreground">(Hidden)</span>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    <div><span className="font-mono">Input:</span> {testCase.input.substring(0, 30)}{testCase.input.length > 30 ? '...' : ''}</div>
                                    <div><span className="font-mono">Output:</span> {testCase.expectedOutput.substring(0, 30)}{testCase.expectedOutput.length > 30 ? '...' : ''}</div>
                                  </div>
                                </div>
                              ))}
                              {question.testCases.length > 1 && (
                                <div className="text-xs text-muted-foreground p-2">
                                  + {question.testCases.length - 1} more test cases
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className={`px-2 py-1 rounded-full ${
                            question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                            question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Link href={`/admin/coding-banks/${params.id}/questions/${question.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {bank.questions.length > 2 && (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground text-sm">
                      + {bank.questions.length - 2} more questions
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">No questions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Question Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Add New Coding Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Text */}
              <div>
                <Label htmlFor="questionText">Problem Statement</Label>
                <textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Describe the coding problem in detail..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-32"
                  required
                />
              </div>
              
              {/* Difficulty and Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full p-3 border border-border rounded-md bg-background text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="10"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    className="bg-background text-white border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Points awarded for correct solution
                  </p>
                </div>
              </div>
              
              {/* Test Cases */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Test Cases</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addTestCase}
                    className="text-primary hover:text-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Test Case
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">Test Case {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateTestCase(index, 'isHidden', !testCase.isHidden)}
                            className="text-muted-foreground hover:text-white"
                          >
                            {testCase.isHidden ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                Hidden
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                Visible
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTestCase(index)}
                            className="text-red-400 hover:text-red-300"
                            disabled={testCases.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`input-${index}`}>Input</Label>
                          <textarea
                            id={`input-${index}`}
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            placeholder="Test case input..."
                            className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-24 font-mono"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use newlines to separate multiple input values
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor={`output-${index}`}>Expected Output</Label>
                          <textarea
                            id={`output-${index}`}
                            value={testCase.expectedOutput}
                            onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                            placeholder="Expected output..."
                            className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-24 font-mono"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Output should match exactly (including whitespace)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Note:</strong> Hidden test cases will not be shown to candidates during the interview,
                    but will still be used to evaluate their solution.
                  </p>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Adding...' : 'Add Question'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CodingBankQuestionsPage;
