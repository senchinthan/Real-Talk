"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Save, Check, X, Edit } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];
  correctAnswer?: string | number;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface AptitudeQuestionBank {
  id: string;
  name: string;
  description: string;
  type: 'aptitude';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionIds: string[];
  questions?: Question[];
  isActive: boolean;
}

interface AptitudeBankQuestionsProps {
  params: Promise<{ id: string }>;
}

const AptitudeBankQuestionsPage = ({ params: paramsPromise }: AptitudeBankQuestionsProps) => {
  const params = use(paramsPromise);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bank, setBank] = useState<AptitudeQuestionBank | null>(null);
  
  // New question form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'text'>('mcq');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number | string>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const response = await fetch(`/api/aptitude-banks/${params.id}?includeQuestions=true`);
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
        } else {
          console.error('Failed to fetch question bank');
        }
      } catch (error) {
        console.error('Error fetching question bank:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [params.id]);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // Adjust correctAnswer if needed
    if (typeof correctAnswer === 'number' && correctAnswer >= index) {
      if (correctAnswer === index) {
        setCorrectAnswer(0);
      } else if (correctAnswer > index) {
        setCorrectAnswer(correctAnswer - 1);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }
    
    if (questionType === 'mcq' && options.some(opt => !opt.trim())) {
      alert('All options must have content');
      return;
    }
    
    setIsSubmitting(true);
    
    const newQuestion = {
      text: questionText,
      type: questionType,
      options: questionType === 'mcq' ? options : undefined,
      correctAnswer: questionType === 'mcq' ? correctAnswer : correctAnswer.toString(),
      difficulty,
      points
    };
    
    try {
      const response = await fetch(`/api/aptitude-banks/${params.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newQuestion)
      });
      
      if (response.ok) {
        // Reset form
        setQuestionText('');
        setQuestionType('mcq');
        setOptions(['', '']);
        setCorrectAnswer(0);
        setDifficulty('medium');
        setPoints(1);
        
        // Refresh bank data
        const bankResponse = await fetch(`/api/aptitude-banks/${params.id}?includeQuestions=true`);
        if (bankResponse.ok) {
          const data = await bankResponse.json();
          setBank(data.data);
        }
      } else {
        console.error('Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/aptitude-banks/${params.id}/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh bank data
        const bankResponse = await fetch(`/api/aptitude-banks/${params.id}?includeQuestions=true`);
        if (bankResponse.ok) {
          const data = await bankResponse.json();
          setBank(data.data);
        }
      } else {
        console.error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
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
            <Link href="/admin/aptitude-banks">Back to Question Banks</Link>
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
            <Link href="/admin/aptitude-banks">
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
          </CardHeader>
          <CardContent>
            {bank.questions && bank.questions.length > 0 ? (
              <div className="space-y-3">
                {bank.questions.slice(0, 10).map((question) => (
                  <div key={question.id} className="p-3 border border-border rounded-md bg-background">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">{question.text}</p>
                        {question.type === 'mcq' && question.options && (
                          <div className="mt-1 space-y-1">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  question.correctAnswer === index ? 'bg-green-500 text-white' : 'bg-gray-700'
                                }`}>
                                  {question.correctAnswer === index && <Check className="w-3 h-3" />}
                                </div>
                                <span className={`text-sm ${
                                  question.correctAnswer === index ? 'text-green-400' : 'text-muted-foreground'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === 'text' && (
                          <div className="mt-1">
                            <span className="text-sm text-green-400">
                              Answer: {question.correctAnswer}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                          <Link href={`/admin/aptitude-banks/${params.id}/questions/${question.id}/edit`}>
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
                {bank.questions.length > 10 && (
                  <div className="text-center py-2">
                    <p className="text-muted-foreground text-sm">
                      + {bank.questions.length - 10} more questions
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
            <CardTitle className="text-white">Add New Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Text */}
              <div>
                <Label htmlFor="questionText">Question Text</Label>
                <textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-24"
                  required
                />
              </div>
              
              {/* Question Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionType">Question Type</Label>
                  <select
                    id="questionType"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as 'mcq' | 'text')}
                    className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-white"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              {/* Points */}
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  type="number"
                  id="points"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="w-full bg-background border-border text-white"
                />
              </div>
              
              {/* MCQ Options */}
              {questionType === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddOption}
                      className="border-border text-white hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`correct-${index}`}
                          name="correctAnswer"
                          checked={correctAnswer === index}
                          onChange={() => setCorrectAnswer(index)}
                          className="w-4 h-4"
                        />
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-background border-border text-white"
                          required
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Text Answer */}
              {questionType === 'text' && (
                <div>
                  <Label htmlFor="textAnswer">Correct Answer</Label>
                  <Input
                    id="textAnswer"
                    value={typeof correctAnswer === 'string' ? correctAnswer : ''}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                    className="w-full bg-background border-border text-white"
                    required
                  />
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Add Question
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AptitudeBankQuestionsPage;
