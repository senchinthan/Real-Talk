"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
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

export default function TextBankDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const [bank, setBank] = useState<TextQuestionBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    difficulty: 'medium',
  });
  const [editMode, setEditMode] = useState(false);
  const [editedBank, setEditedBank] = useState<Partial<TextQuestionBank>>({});

  useEffect(() => {
    const fetchBank = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/text-banks/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
          setEditedBank({
            name: data.data.name,
            description: data.data.description,
            difficulty: data.data.difficulty,
            isActive: data.data.isActive
          });
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

  const handleSaveBank = async () => {
    if (!editedBank.name?.trim()) {
      toast.error('Bank name is required');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/text-banks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedBank)
      });
      
      if (response.ok) {
        if (bank) {
          setBank({
            ...bank,
            ...editedBank as TextQuestionBank
          });
        }
        setEditMode(false);
        toast.success('Question bank updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update question bank');
      }
    } catch (error) {
      console.error('Error updating question bank:', error);
      toast.error('Error updating question bank');
    } finally {
      setIsSaving(false);
    }
  };

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
        }
        
        setNewQuestion({
          text: '',
          difficulty: 'medium'
        });
        setIsAddingQuestion(false);
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
        if (bank && bank.questions) {
          setBank({
            ...bank,
            questions: bank.questions.filter(q => q.id !== questionId),
            questionIds: bank.questionIds.filter(id => id !== questionId)
          });
        }
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
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/text-banks')} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Text Question Bank</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bank Details */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bank Details</CardTitle>
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditMode(false);
                    setEditedBank({
                      name: bank.name,
                      description: bank.description,
                      difficulty: bank.difficulty,
                      isActive: bank.isActive
                    });
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!editMode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                    <p className="text-lg">{bank.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm">{bank.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Difficulty</h3>
                      <Badge variant="outline" className={`${getDifficultyColor(bank.difficulty)} capitalize`}>
                        {bank.difficulty}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                      <Badge variant={bank.isActive ? "default" : "secondary"}>
                        {bank.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                    <p className="text-sm">{new Date(bank.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  {bank.updatedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                      <p className="text-sm">{new Date(bank.updatedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      value={editedBank.name || ''}
                      onChange={(e) => setEditedBank({ ...editedBank, name: e.target.value })}
                      placeholder="Bank name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={editedBank.description || ''}
                      onChange={(e) => setEditedBank({ ...editedBank, description: e.target.value })}
                      placeholder="Describe the purpose of this bank"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="difficulty" className="text-sm font-medium">
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty"
                      value={editedBank.difficulty || 'mixed'}
                      onChange={(e) => setEditedBank({ ...editedBank, difficulty: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editedBank.isActive || false}
                      onChange={(e) => setEditedBank({ ...editedBank, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">
                      Active
                    </label>
                  </div>
                  
                  <Button 
                    onClick={handleSaveBank} 
                    disabled={isSaving} 
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Questions */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Questions ({bank.questions?.length || 0})</CardTitle>
                {!isAddingQuestion ? (
                  <Button onClick={() => setIsAddingQuestion(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              <CardDescription>
                Text interview questions for this bank
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingQuestion && (
                <Card className="bg-muted/50 border-border mb-6">
                  <CardContent className="pt-6">
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
                      
                      <Button 
                        onClick={handleAddQuestion} 
                        disabled={isSaving || !newQuestion.text.trim()}
                        className="w-full"
                      >
                        {isSaving ? 'Adding...' : 'Add Question'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {bank.questions && bank.questions.length > 0 ? (
                <div className="space-y-4">
                  {bank.questions.map((question) => (
                    <Card key={question.id} className="bg-card border-border">
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No questions added to this bank yet.</p>
                  {!isAddingQuestion && (
                    <Button onClick={() => setIsAddingQuestion(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Question
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
