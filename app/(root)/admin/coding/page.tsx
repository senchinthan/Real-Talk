"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Search, AlertCircle, Code } from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface CodingQuestion {
  id: string;
  text: string;
  type: 'code';
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  testCases: TestCase[];
}

const CodingQuestionsPage = () => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/coding');
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.data);
        } else {
          console.error('Failed to fetch questions');
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/coding/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      } else {
        alert('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question');
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Coding Question Bank</h1>
            <p className="text-muted-foreground">Manage coding questions and test cases for interview rounds</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/admin/coding/create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Question
            </Link>
          </Button>
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
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || filterDifficulty !== 'all'
                  ? "No questions match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't added any coding questions yet. Click 'Add New Question' to get started."}
              </p>
              {(searchTerm || filterDifficulty !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-border text-white"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDifficulty('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          Coding Challenge
                        </span>
                        {question.difficulty && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            question.difficulty === 'easy' 
                              ? 'bg-green-500/20 text-green-400' 
                              : question.difficulty === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        )}
                        {question.points && (
                          <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                            {question.points} point{question.points !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">{question.text}</h3>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-white mb-2">Test Cases: {question.testCases?.length || 0}</h4>
                        <div className="space-y-2">
                          {question.testCases?.slice(0, 2).map((testCase, index) => (
                            <div key={index} className="bg-muted/20 p-3 rounded-md text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs text-muted-foreground">Input:</span>
                                  <pre className="mt-1 p-2 bg-background rounded border border-border text-white overflow-x-auto">
                                    {testCase.input.length > 50 ? testCase.input.substring(0, 50) + '...' : testCase.input}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Expected Output:</span>
                                  <pre className="mt-1 p-2 bg-background rounded border border-border text-white overflow-x-auto">
                                    {testCase.expectedOutput.length > 50 ? testCase.expectedOutput.substring(0, 50) + '...' : testCase.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                          {question.testCases && question.testCases.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              + {question.testCases.length - 2} more test case(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2 sm:gap-3 items-center sm:items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-border text-white hover:bg-muted"
                      >
                        <Link href={`/admin/coding/${question.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(question.id)}
                        className="border-border text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingQuestionsPage;
