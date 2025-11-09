"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

interface Option {
  text: string;
}

interface QuestionData {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];
  correctAnswer?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

interface EditAptitudeQuestionProps {
  params: Promise<{ id: string }>;
}

const EditAptitudeQuestionPage = ({ params: paramsPromise }: EditAptitudeQuestionProps) => {
  const params = use(paramsPromise);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'text' | 'code'>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Option[]>([{ text: '' }, { text: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState<number>(1);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`/api/aptitude/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          const questionData = data.data;
          
          setQuestion(questionData);
          setQuestionType(questionData.type);
          setQuestionText(questionData.text);
          setDifficulty(questionData.difficulty || 'medium');
          setPoints(questionData.points || 1);
          
          if (questionData.type === 'mcq' && questionData.options) {
            setOptions(questionData.options.map((text: string) => ({ text })));
            setCorrectAnswer(questionData.correctAnswer || 0);
          }
        } else {
          console.error('Failed to fetch question');
          router.push('/admin/aptitude');
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        router.push('/admin/aptitude');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [params.id, router]);

  const addOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      alert('MCQ questions must have at least 2 options');
      return;
    }
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // Adjust correctAnswer if needed
    if (correctAnswer >= index && correctAnswer > 0) {
      setCorrectAnswer(correctAnswer - 1);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { text };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }
    
    if (questionType === 'mcq') {
      // Validate MCQ options
      if (options.some(option => !option.text.trim())) {
        alert('All options must have text');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const questionData = {
        text: questionText,
        type: questionType,
        difficulty,
        points,
        ...(questionType === 'mcq' && {
          options: options.map(o => o.text),
          correctAnswer
        })
      };
      
      const response = await fetch(`/api/aptitude/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData)
      });
      
      if (response.ok) {
        router.push('/admin/aptitude');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Question Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested question could not be found.</p>
          <Button asChild>
            <Link href="/admin/aptitude">Back to Questions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/aptitude">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Edit Aptitude Question</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-white">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as 'mcq' | 'text' | 'code')}
                  className="w-full p-3 rounded-md border border-border bg-background text-white"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="text">Text Answer</option>
                  <option value="code">Coding</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="questionText">Question Text</Label>
                <textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the question text..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-24"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full p-3 rounded-md border border-border bg-background text-white"
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
                </div>
              </div>
            </CardContent>
          </Card>

          {questionType === 'mcq' && (
            <Card className="bg-card border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Answer Options</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="border-border text-white hover:bg-muted"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={correctAnswer === index}
                        onChange={() => setCorrectAnswer(index)}
                        className="w-4 h-4"
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-grow bg-background text-white border-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Select the radio button next to the correct answer.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-border text-white hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAptitudeQuestionPage;
