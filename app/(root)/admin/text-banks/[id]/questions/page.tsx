"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'text';
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface TextQuestionBank {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionIds: string[];
  questions?: Question[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export default function AddQuestionsPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use() with proper typing
  const unwrappedParams = use(params as any) as { id: string };
  const id = unwrappedParams.id;
  const router = useRouter();
  const [bank, setBank] = useState<TextQuestionBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    difficulty: 'medium',
  });
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/text-banks/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
          setQuestions(data.data.questions || []);
        } else {
          console.error('Failed to fetch text question bank');
          toast.error('Failed to load text question bank');
          router.push('/admin/text-banks');
        }
      } catch (error) {
        console.error('Error fetching text question bank:', error);
        toast.error('Error loading text question bank');
        router.push('/admin/text-banks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [id, router]);

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      toast.error('Question text is required');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/text-banks/${id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newQuestion.text,
          type: 'text',
          difficulty: newQuestion.difficulty
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Refresh the bank data to include the new question
        const bankResponse = await fetch(`/api/text-banks/${id}`);
        if (bankResponse.ok) {
          const bankData = await bankResponse.json();
          setBank(bankData.data);
          setQuestions(bankData.data.questions || []);
        }
        
        setNewQuestion({
          text: '',
          difficulty: 'medium'
        });
        toast.success('Question added successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Error adding question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the bank?')) {
      return;
    }

    try {
      const response = await fetch(`/api/text-banks/${id}/questions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId })
      });
      
      if (response.ok) {
        // Update local state
        setQuestions(questions.filter(q => q.id !== questionId));
        toast.success('Question removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove question');
      }
    } catch (error) {
      console.error('Error removing question:', error);
      toast.error('Error removing question');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'hard': return 'bg-red-500/20 text-red-500';
      default: return 'bg-blue-500/20 text-blue-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Question Bank Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested question bank could not be found.</p>
          <Button onClick={() => router.push('/admin/text-banks')}>
            Back to Text Banks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/text-banks')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Questions</h1>
            <p className="text-muted-foreground">{bank.name} • {bank.questionIds.length} questions</p>
          </div>
        </div>

        {/* Add New Question */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
            <CardDescription>Create a new text interview question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="questionText" className="text-sm font-medium">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="questionText"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                  required
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="questionDifficulty" className="text-sm font-medium">
                  Difficulty
                </label>
                <select
                  id="questionDifficulty"
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddQuestion} 
                  disabled={isSaving || !newQuestion.text.trim()}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Questions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Existing Questions</CardTitle>
            <CardDescription>
              {questions.length === 0 
                ? "No questions added to this bank yet" 
                : `${questions.length} questions in this bank`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Start adding questions using the form above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id} className="bg-muted/30 border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${getDifficultyColor(question.difficulty || 'medium')} capitalize`}>
                              {question.difficulty || 'medium'}
                            </Badge>
                          </div>
                          <p className="text-sm">{question.text}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
