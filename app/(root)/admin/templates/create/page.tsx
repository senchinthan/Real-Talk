"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  type: 'aptitude' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionIds: string[];
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

interface Round {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'code' | 'aptitude';
  description: string;
  duration: number | null; // null for voice interviews
  questionBankId?: string;
  questionCount?: number;
  promptTemplateId?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState({
    companyName: '',
    description: '',
    isActive: true,
    companyLogo: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Partial<Round>>({
    name: '',
    type: 'voice',
    description: '',
    duration: null, // null for voice interviews
    questionCount: 5,
    difficulty: 'mixed',
  });
  
  // State for question banks and prompts
  const [aptitudeBanks, setAptitudeBanks] = useState<QuestionBank[]>([]);
  const [codingBanks, setCodingBanks] = useState<QuestionBank[]>([]);
  const [textBanks, setTextBanks] = useState<QuestionBank[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  
  // Fetch question banks and prompts
  useEffect(() => {
    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        // Fetch aptitude question banks
        const aptitudeResponse = await fetch('/api/aptitude-banks');
        const aptitudeData = await aptitudeResponse.json();
        if (aptitudeData.success) {
          setAptitudeBanks(aptitudeData.data);
        }
        
        // Fetch coding question banks
        const codingResponse = await fetch('/api/coding-banks');
        const codingData = await codingResponse.json();
        if (codingData.success) {
          setCodingBanks(codingData.data);
        }
        
        // Fetch text question banks
        const textResponse = await fetch('/api/text-banks');
        const textData = await textResponse.json();
        if (textData.success) {
          setTextBanks(textData.data);
        } else {
          // If API doesn't exist yet, use empty array
          setTextBanks([]);
        }
        
        // Fetch prompt templates
        const promptsResponse = await fetch('/api/prompts');
        const promptsData = await promptsResponse.json();
        if (promptsData.success) {
          setPromptTemplates(promptsData.data);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load question banks and prompts');
      } finally {
        setLoadingResources(false);
      }
    };
    
    fetchResources();
  }, []);

  const handleAddRound = () => {
    if (!currentRound.name || !currentRound.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate question bank selection for aptitude, code, and text rounds
    if ((currentRound.type === 'aptitude' || currentRound.type === 'code' || currentRound.type === 'text') && !currentRound.questionBankId) {
      toast.error('Please select a question bank');
      return;
    }
    
    // Validate prompt template for voice interviews
    if (currentRound.type === 'voice' && !currentRound.promptTemplateId) {
      toast.error('Please select a prompt template for voice interviews');
      return;
    }
    
    // Validate duration for non-voice rounds
    if (currentRound.type !== 'voice' && (!currentRound.duration || currentRound.duration < 5)) {
      toast.error('Please specify a valid duration (minimum 5 minutes)');
      return;
    }

    const newRound: Round = {
      id: `round-${Date.now()}`,
      name: currentRound.name || 'New Round',
      type: currentRound.type as 'voice' | 'text' | 'code' | 'aptitude',
      description: currentRound.description || '',
      duration: currentRound.duration || 30,
      questionBankId: currentRound.questionBankId,
      questionCount: currentRound.questionCount || 5,
      promptTemplateId: currentRound.promptTemplateId,
      difficulty: currentRound.difficulty,
    };

    setRounds([...rounds, newRound]);
    setCurrentRound({
      name: '',
      type: 'voice',
      description: '',
      duration: null, // null for voice interviews
      questionCount: 5,
      difficulty: 'mixed',
    });
  };


  const handleRemoveRound = (roundId: string) => {
    setRounds(rounds.filter(round => round.id !== roundId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (rounds.length === 0) {
      toast.error('Please add at least one round');
      return;
    }

    setIsLoading(true);

    try {
      // Upload logo if selected
      let companyLogo = template.companyLogo;
      
      if (logoFile) {
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
        });
        
        reader.readAsDataURL(logoFile);
        const fileData = await fileDataPromise;
        
        // Upload the logo
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileData,
            path: 'companies'
          }),
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            companyLogo = uploadData.data.url;
          } else {
            throw new Error(uploadData.error || 'Failed to upload logo');
          }
        } else {
          throw new Error('Failed to upload logo');
        }
      }
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          companyLogo,
          rounds,
        }),
      });

      // Get the response text first
      const responseText = await response.text();
      
      // If not OK, try to parse the error message
      if (!response.ok) {
        let errorMessage = 'Failed to create template';
        try {
          // Try to parse as JSON if possible
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError) {
          // If not valid JSON, use the raw text
          errorMessage = responseText || errorMessage;
        }
        console.error('API Error:', errorMessage);
        toast.error(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      toast.success('Template created successfully');
      router.push('/admin/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      // The error message is already shown in the toast above if it's from the API
      if (!(error instanceof Error && error.message !== 'Failed to create template')) {
        toast.error('Failed to create template');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Template</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Enter the basic information for this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="companyName"
                value={template.companyName}
                onChange={(e) => setTemplate({ ...template, companyName: e.target.value })}
                placeholder="e.g., Google, Microsoft"
                required
              />
            </div>
            <div>
              <label htmlFor="companyLogo" className="block text-sm font-medium mb-1">
                Company Logo
              </label>
              <FileUpload
                onFileChange={(file) => setLogoFile(file)}
                previewUrl={template.companyLogo}
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a company logo (recommended size: 200x200px)
              </p>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Enter a brief description of this template"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Rounds</CardTitle>
            <CardDescription>Add interview rounds to this template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roundName" className="block text-sm font-medium mb-1">
                    Round Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="roundName"
                    value={currentRound.name}
                    onChange={(e) => setCurrentRound({ ...currentRound, name: e.target.value })}
                    placeholder="e.g., Technical Interview, HR Round"
                  />
                </div>
                <div>
                  <label htmlFor="roundType" className="block text-sm font-medium mb-1">
                    Round Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="roundType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={currentRound.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'voice' | 'text' | 'code' | 'aptitude';
                      setCurrentRound({ 
                        ...currentRound, 
                        type: newType,
                        // Reset question bank if type changes
                        questionBankId: undefined,
                        // Reset prompt template if type changes from voice
                        promptTemplateId: newType === 'voice' ? currentRound.promptTemplateId : undefined,
                        // Set duration to null for voice interviews, or keep/set default for others
                        duration: newType === 'voice' ? null : (currentRound.duration || 30)
                      });
                    }}
                  >
                    <option value="voice">Voice Interview</option>
                    <option value="text">Text Interview</option>
                    <option value="code">Coding Challenge</option>
                    <option value="aptitude">Aptitude Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="roundDescription" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="roundDescription"
                  value={currentRound.description}
                  onChange={(e) => setCurrentRound({ ...currentRound, description: e.target.value })}
                  placeholder="Enter a description for this round"
                  rows={2}
                />
              </div>

              {/* Duration field - not shown for voice interviews */}
              {currentRound.type !== 'voice' && (
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="120"
                    value={currentRound.duration || ''}
                    onChange={(e) => setCurrentRound({ ...currentRound, duration: parseInt(e.target.value) || 30 })}
                    className="w-32"
                  />
                </div>
              )}
              
              {/* Voice Interview Prompt Template Selection */}
              {currentRound.type === 'voice' && (
                <div>
                  <label htmlFor="promptTemplate" className="block text-sm font-medium mb-1">
                    Prompt Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="promptTemplate"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={currentRound.promptTemplateId || ''}
                    onChange={(e) => setCurrentRound({ ...currentRound, promptTemplateId: e.target.value })}
                    disabled={loadingResources}
                  >
                    <option value="">Select a prompt template</option>
                    {promptTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {loadingResources && <p className="text-xs text-muted-foreground mt-1">Loading prompt templates...</p>}
                </div>
              )}
              
              {/* Question Bank Selection for Aptitude, Coding, and Text */}
              {(currentRound.type === 'aptitude' || currentRound.type === 'code' || currentRound.type === 'text') && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="questionBank" className="block text-sm font-medium mb-1">
                      Question Bank <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="questionBank"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={currentRound.questionBankId || ''}
                      onChange={(e) => setCurrentRound({ ...currentRound, questionBankId: e.target.value })}
                      disabled={loadingResources}
                    >
                      <option value="">Select a question bank</option>
                      {currentRound.type === 'aptitude' && aptitudeBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.difficulty})
                        </option>
                      ))}
                      {currentRound.type === 'code' && codingBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.difficulty})
                        </option>
                      ))}
                      {currentRound.type === 'text' && textBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.difficulty})
                        </option>
                      ))}
                    </select>
                    {loadingResources && <p className="text-xs text-muted-foreground mt-1">Loading question banks...</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="questionCount" className="block text-sm font-medium mb-1">
                      Number of Questions <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="questionCount"
                      type="number"
                      min="1"
                      max="20"
                      value={currentRound.questionCount}
                      onChange={(e) => setCurrentRound({ ...currentRound, questionCount: parseInt(e.target.value) || 5 })}
                      className="w-32"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={currentRound.difficulty || 'mixed'}
                      onChange={(e) => setCurrentRound({ ...currentRound, difficulty: e.target.value as any })}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              )}


              <Button
                type="button"
                onClick={handleAddRound}
                variant="outline"
                className="w-full mt-4"
                disabled={!currentRound.name || !currentRound.type}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Round
              </Button>
            </div>

            {rounds.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Added Rounds</h3>
                <div className="space-y-4">
                  {rounds.map((round) => (
                    <div key={round.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{round.name}</h4>
                          <p className="text-sm text-gray-500">
                            {round.type}
                            {round.type !== 'voice' && round.duration ? ` • ${round.duration} minutes` : ''}
                            {round.questionCount ? ` • ${round.questionCount} questions` : ''}
                            {round.difficulty ? ` • ${round.difficulty}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(round.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/templates')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || rounds.length === 0}>
            {isLoading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}
