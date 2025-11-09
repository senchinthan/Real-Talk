"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

const CreateCodingQuestionPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isHidden: false }
  ]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState<number>(3);

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
        type: 'code',
        difficulty,
        points,
        testCases
      };
      
      const response = await fetch('/api/coding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData)
      });
      
      if (response.ok) {
        router.push('/admin/coding');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error creating question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/coding">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Create Coding Question</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-white">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Test Cases</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTestCase}
                  className="border-border text-white hover:bg-muted"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Test Case
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> Hidden test cases will not be shown to candidates during the interview,
                  but will still be used to evaluate their solution.
                </p>
              </div>
            </CardContent>
          </Card>

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
              {isSubmitting ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCodingQuestionPage;
