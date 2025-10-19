"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';

interface Round {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'code';
  duration: number;
  questions: string[];
  passingScore?: number;
}

interface Template {
  id: string;
  companyName: string;
  companyLogo: string;
  description: string;
  rounds: Round[];
  isActive: boolean;
  createdAt: string;
}

interface EditTemplateProps {
  params: Promise<{ id: string }>;
}

const EditTemplatePage = ({ params }: EditTemplateProps) => {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const resolvedParams = await params;
        setTemplateId(resolvedParams.id);
        
        // Fetch template data
        const response = await fetch(`/api/companies/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setTemplate(data.data);
        } else {
          console.error('Failed to load template');
          router.push('/admin/templates');
        }
      } catch (error) {
        console.error('Error loading template:', error);
        router.push('/admin/templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [params, router]);

  const updateTemplate = (field: keyof Template, value: any) => {
    if (template) {
      setTemplate({ ...template, [field]: value });
    }
  };

  const addRound = () => {
    if (template) {
      const newRound: Round = {
        id: `round-${Date.now()}`,
        name: '',
        type: 'voice',
        duration: 45,
        questions: [''],
        passingScore: 70
      };
      setTemplate({
        ...template,
        rounds: [...template.rounds, newRound]
      });
    }
  };

  const removeRound = (roundId: string) => {
    if (template) {
      setTemplate({
        ...template,
        rounds: template.rounds.filter(round => round.id !== roundId)
      });
    }
  };

  const updateRound = (roundId: string, field: keyof Round, value: any) => {
    if (template) {
      setTemplate({
        ...template,
        rounds: template.rounds.map(round => 
          round.id === roundId ? { ...round, [field]: value } : round
        )
      });
    }
  };

  const addQuestion = (roundId: string) => {
    if (template) {
      setTemplate({
        ...template,
        rounds: template.rounds.map(round => 
          round.id === roundId 
            ? { ...round, questions: [...round.questions, ''] }
            : round
        )
      });
    }
  };

  const removeQuestion = (roundId: string, questionIndex: number) => {
    if (template) {
      setTemplate({
        ...template,
        rounds: template.rounds.map(round => 
          round.id === roundId 
            ? { 
                ...round, 
                questions: round.questions.filter((_, index) => index !== questionIndex)
              }
            : round
        )
      });
    }
  };

  const updateQuestion = (roundId: string, questionIndex: number, value: string) => {
    if (template) {
      setTemplate({
        ...template,
        rounds: template.rounds.map(round => 
          round.id === roundId 
            ? { 
                ...round, 
                questions: round.questions.map((q, index) => 
                  index === questionIndex ? value : q
                )
              }
            : round
        )
      });
    }
  };

  const handleSave = async () => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        alert('Template updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const toggleActive = async () => {
    if (!template) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !template.isActive
        })
      });

      if (response.ok) {
        setTemplate({ ...template, isActive: !template.isActive });
        alert(`Template ${!template.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Error updating template status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested template could not be found.</p>
          <Button asChild>
            <Link href="/admin/templates">Back to Templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Template</h1>
              <p className="text-muted-foreground">{template.companyName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleActive}
              disabled={isSubmitting}
              variant={template.isActive ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {template.isActive ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Activate
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

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
                  onChange={(e) => updateTemplate('companyName', e.target.value)}
                  placeholder="e.g., Google, Amazon, Meta"
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyLogo">Company Logo URL</Label>
                <Input
                  id="companyLogo"
                  value={template.companyLogo}
                  onChange={(e) => updateTemplate('companyLogo', e.target.value)}
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
                onChange={(e) => updateTemplate('description', e.target.value)}
                placeholder="Describe the interview process..."
                className="w-full p-3 border rounded-md"
                rows={3}
                required
              />
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={template.isActive}
                  onChange={(e) => updateTemplate('isActive', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive">Template is active and visible to users</Label>
              </div>
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

            {template.rounds.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rounds added yet. Click "Add Round" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {template.rounds.map((round, index) => (
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

          {/* Template Info */}
          <div className="card-border p-6">
            <h2 className="text-xl font-semibold mb-4">Template Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Template ID:</span>
                <span className="ml-2 font-mono">{templateId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">{new Date(template.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Rounds:</span>
                <span className="ml-2">{template.rounds.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={`ml-2 ${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTemplatePage;
