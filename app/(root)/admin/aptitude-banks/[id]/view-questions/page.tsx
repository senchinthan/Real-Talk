"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Search, Check, Trash2, AlertCircle } from 'lucide-react';
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

interface ViewAptitudeQuestionsProps {
  params: Promise<{ id: string }>;
}

const ViewAptitudeQuestionsPage = ({ params: paramsPromise }: ViewAptitudeQuestionsProps) => {
  const params = use(paramsPromise);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bank, setBank] = useState<AptitudeQuestionBank | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const response = await fetch(`/api/aptitude-banks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Bank data received:', data.data);
          console.log('Questions count:', data.data.questions?.length || 0);
          console.log('Question IDs count:', data.data.questionIds?.length || 0);
          setBank(data.data);
        } else {
          console.error('Failed to fetch question bank');
          router.push('/admin/aptitude-banks');
        }
      } catch (error) {
        console.error('Error fetching question bank:', error);
        router.push('/admin/aptitude-banks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [params.id, router]);

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the bank?')) return;
    
    try {
      const response = await fetch(`/api/aptitude-banks/${params.id}/questions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId })
      });
      
      if (response.ok) {
        // Update the bank data
        setBank(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            questionIds: prev.questionIds.filter(id => id !== questionId),
            questions: prev.questions?.filter(q => q.id !== questionId)
          };
        });
      } else {
        alert('Failed to remove question');
      }
    } catch (error) {
      console.error('Error removing question:', error);
      alert('Error removing question');
    }
  };

  // Log bank data for debugging
  useEffect(() => {
    if (bank) {
      console.log('Bank data updated:', bank);
      console.log('Questions available:', bank.questions?.length || 0);
      console.log('Question IDs:', bank.questionIds);
    }
  }, [bank]);

  const filteredQuestions = bank?.questions?.filter(question => {
    const matchesSearch = 
      question.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = 
      filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });
  
  // Log filtered questions for debugging
  useEffect(() => {
    console.log('Filtered questions:', filteredQuestions?.length || 0);
  }, [filteredQuestions]);

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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/aptitude-banks/${params.id}/questions`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{bank.name} - All Questions</h1>
            <p className="text-muted-foreground">{bank.description}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background text-white border-border"
            />
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 rounded-md border border-border bg-background text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Questions List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Questions</CardTitle>
            <CardDescription>
              {filteredQuestions?.length || 0} question{(filteredQuestions?.length || 0) !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredQuestions && filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <p className="text-white mb-2">{question.text}</p>
                        
                        {question.type === 'mcq' && question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                  index === question.correctAnswer 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {index === question.correctAnswer ? <Check className="w-3 h-3" /> : index + 1}
                                </span>
                                <span className={index === question.correctAnswer ? 'text-green-400' : 'text-muted-foreground'}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'text' && (
                          <div className="ml-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-green-400">Correct Answer:</span>
                              <span className="text-muted-foreground">{question.correctAnswer}</span>
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No questions match your filters</p>
                {(searchTerm || filterDifficulty !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-4 border-border text-white"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDifficulty('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            asChild
            className="border-border text-white hover:bg-muted"
          >
            <Link href={`/admin/aptitude-banks/${params.id}/questions`}>
              Back to Add Questions
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            asChild
            className="border-border text-white hover:bg-muted"
          >
            <Link href="/admin/aptitude-banks">
              All Question Banks
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewAptitudeQuestionsPage;
