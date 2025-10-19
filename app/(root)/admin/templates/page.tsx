"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';

interface Round {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'code';
  duration: number;
  questions: string[];
  passingScore?: number;
}

const AdminTemplatesPage = () => {
  const [template, setTemplate] = useState({
    companyName: '',
    companyLogo: '',
    description: '',
    isActive: true
  });
  
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRound = () => {
    const newRound: Round = {
      id: `round-${Date.now()}`,
      name: '',
      type: 'voice',
      duration: 45,
      questions: [''],
      passingScore: 70
    };
    setRounds([...rounds, newRound]);
  };

  const removeRound = (roundId: string) => {
    setRounds(rounds.filter(round => round.id !== roundId));
  };

  const updateRound = (roundId: string, field: keyof Round, value: any) => {
    setRounds(rounds.map(round => 
      round.id === roundId ? { ...round, [field]: value } : round
    ));
  };

  const addQuestion = (roundId: string) => {
    setRounds(rounds.map(round => 
      round.id === roundId 
        ? { ...round, questions: [...round.questions, ''] }
        : round
    ));
  };

  const removeQuestion = (roundId: string, questionIndex: number) => {
    setRounds(rounds.map(round => 
      round.id === roundId 
        ? { 
            ...round, 
            questions: round.questions.filter((_, index) => index !== questionIndex)
          }
        : round
    ));
  };

  const updateQuestion = (roundId: string, questionIndex: number, value: string) => {
    setRounds(rounds.map(round => 
      round.id === roundId 
        ? { 
            ...round, 
            questions: round.questions.map((q, index) => 
              index === questionIndex ? value : q
            )
          }
        : round
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: template.companyName,
          companyLogo: template.companyLogo,
          description: template.description,
          rounds: rounds,
          isActive: template.isActive
        })
      });

      if (response.ok) {
        alert('Template created successfully!');
        // Reset form
        setTemplate({
          companyName: '',
          companyLogo: '',
          description: '',
          isActive: true
        });
        setRounds([]);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Company Template</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card-border p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={template.companyName}
                  onChange={(e) => setTemplate({...template, companyName: e.target.value})}
                  placeholder="e.g., Google, Amazon, Meta"
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyLogo">Company Logo URL</Label>
                <Input
                  id="companyLogo"
                  value={template.companyLogo}
                  onChange={(e) => setTemplate({...template, companyLogo: e.target.value})}
                  placeholder="https://example.com/logo.png"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={template.description}
                onChange={(e) => setTemplate({...template, description: e.target.value})}
                placeholder="Describe the interview process..."
                className="w-full p-3 border rounded-md"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Rounds */}
          <div className="card-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Interview Rounds</h2>
              <Button type="button" onClick={addRound} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Round
              </Button>
            </div>

            {rounds.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rounds added yet. Click "Add Round" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {rounds.map((round, index) => (
                  <div key={round.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Round {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRound(round.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label>Round Name</Label>
                        <Input
                          value={round.name}
                          onChange={(e) => updateRound(round.id, 'name', e.target.value)}
                          placeholder="e.g., Phone Screen, Coding Round"
                          required
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <select
                          value={round.type}
                          onChange={(e) => updateRound(round.id, 'type', e.target.value)}
                          className="w-full p-3 border rounded-md"
                        >
                          <option value="voice">Voice Interview</option>
                          <option value="text">Text Interview</option>
                          <option value="code">Coding Challenge</option>
                        </select>
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={round.duration}
                          onChange={(e) => updateRound(round.id, 'duration', parseInt(e.target.value))}
                          min="15"
                          max="120"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label>Passing Score (optional)</Label>
                      <Input
                        type="number"
                        value={round.passingScore || ''}
                        onChange={(e) => updateRound(round.id, 'passingScore', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="70"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Questions</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addQuestion(round.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Question
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {round.questions.map((question, qIndex) => (
                          <div key={qIndex} className="flex gap-2">
                            <Input
                              value={question}
                              onChange={(e) => updateQuestion(round.id, qIndex, e.target.value)}
                              placeholder={`Question ${qIndex + 1}`}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(round.id, qIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || rounds.length === 0} className="btn-primary">
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Template
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTemplatesPage;
