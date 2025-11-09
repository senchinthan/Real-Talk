"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];
  correctAnswer?: string | number;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface EditQuestionPageProps {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
}

const EditQuestionPage = ({ params: paramsPromise }: EditQuestionPageProps) => {
  const params = use(paramsPromise);
  const bankId = params.id;
  const questionId = params.questionId;
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bankName, setBankName] = useState('');
  
  const [formData, setFormData] = useState<Question>({
    id: questionId,
    text: '',
    type: 'mcq',
    options: ['', ''],
    correctAnswer: 0,
    difficulty: 'medium',
    points: 1
  });

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true);
        
        // First get the bank to get the bank name
        const bankResponse = await fetch(`/api/aptitude-banks/${bankId}`);
        if (bankResponse.ok) {
          const bankData = await bankResponse.json();
          setBankName(bankData.data.name);
        }
        
        // Then get the question details
        const response = await fetch(`/api/aptitude-banks/${bankId}/questions/${questionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.question) {
            setFormData({
              id: questionId,
              text: data.question.text || '',
              type: data.question.type || 'mcq',
              options: data.question.options || ['', ''],
              correctAnswer: data.question.correctAnswer !== undefined ? data.question.correctAnswer : 0,
              difficulty: data.question.difficulty || 'medium',
              points: data.question.points || 1
            });
          } else {
            toast.error('Failed to load question data');
            router.push(`/admin/aptitude-banks/${bankId}/questions`);
          }
        } else {
          toast.error('Failed to fetch question');
          router.push(`/admin/aptitude-banks/${bankId}/questions`);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        toast.error('Error loading question');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [bankId, questionId, router]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      // Reset options and correctAnswer when changing question type
      if (value === 'mcq') {
        setFormData(prev => ({ 
          ...prev, 
          type: 'mcq' as const,
          options: prev.options?.length ? prev.options : ['', ''],
          correctAnswer: 0
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          type: 'text' as const,
          correctAnswer: ''
        }));
      }
    } else if (name === 'correctAnswer' && formData.type === 'mcq') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else if (name === 'difficulty') {
      setFormData(prev => ({ ...prev, difficulty: value as 'easy' | 'medium' | 'hard' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({ 
      ...prev, 
      options: [...(prev.options || []), ''] 
    }));
  };

  const removeOption = (index: number) => {
    if ((formData.options?.length || 0) <= 2) {
      toast.error('Questions must have at least 2 options');
      return;
    }
    
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    
    // Adjust correctAnswer if needed
    let newCorrectAnswer = formData.correctAnswer;
    if (typeof newCorrectAnswer === 'number') {
      if (newCorrectAnswer === index) {
        newCorrectAnswer = 0;
      } else if (newCorrectAnswer > index) {
        newCorrectAnswer = newCorrectAnswer - 1;
      }
    }
    
    setFormData(prev => ({ 
      ...prev, 
      options: newOptions,
      correctAnswer: newCorrectAnswer
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.text.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    if (formData.type === 'mcq') {
      if (!formData.options || formData.options.length < 2) {
        toast.error('MCQ questions must have at least 2 options');
        return;
      }
      
      if (formData.options.some(opt => !opt.trim())) {
        toast.error('All options must have content');
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/aptitude-banks/${bankId}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Question updated successfully');
        router.push(`/admin/aptitude-banks/${bankId}/questions`);
      } else {
        const error = await response.json();
        toast.error(`Failed to update question: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Error updating question');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/aptitude-banks/${bankId}/questions`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Question</h1>
            <p className="text-muted-foreground">Bank: {bankName}</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Question Details</CardTitle>
            <CardDescription>Update the question information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="text" className="text-white">Question Text</Label>
                <textarea
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={(e) => handleTextChange(e)}
                  placeholder="Enter your question here..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-24"
                  required
                />
              </div>
              
              {/* Question Type and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-white">Question Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-white"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleSelectChange}
                    className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              {/* Points */}
              <div className="space-y-2">
                <Label htmlFor="points" className="text-white">Points</Label>
                <Input
                  type="number"
                  id="points"
                  name="points"
                  value={formData.points}
                  onChange={handleNumberChange}
                  min={1}
                  max={10}
                  className="w-full bg-background border-border text-white"
                />
              </div>
              
              {/* MCQ Options */}
              {formData.type === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Options</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addOption}
                      className="border-border text-white hover:bg-muted"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`correct-${index}`}
                          name="correctAnswerRadio"
                          checked={formData.correctAnswer === index}
                          onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                          className="w-4 h-4 text-primary"
                        />
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-background border-border text-white"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Text Answer */}
              {formData.type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer" className="text-white">Correct Answer</Label>
                  <Input
                    id="correctAnswer"
                    name="correctAnswer"
                    value={formData.correctAnswer as string}
                    onChange={handleTextChange}
                    placeholder="Enter the correct answer"
                    className="w-full bg-background border-border text-white"
                    required
                  />
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              asChild
              className="border-border text-white hover:bg-muted"
            >
              <Link href={`/admin/aptitude-banks/${bankId}/questions`}>
                Cancel
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EditQuestionPage;
