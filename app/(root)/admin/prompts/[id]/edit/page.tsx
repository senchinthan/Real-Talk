"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Info } from 'lucide-react';
import Link from 'next/link';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

interface EditPromptTemplateProps {
  params: Promise<{ id: string }>;
}

const EditPromptTemplatePage = ({ params: paramsPromise }: EditPromptTemplateProps) => {
  const params = use(paramsPromise);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<PromptTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/prompts/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          const templateData = data.data;
          
          setTemplate(templateData);
          setName(templateData.name);
          setDescription(templateData.description || '');
          setPrompt(templateData.prompt);
          setIsActive(templateData.isActive);
        } else {
          console.error('Failed to fetch template');
          router.push('/admin/prompts');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        router.push('/admin/prompts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !prompt.trim()) {
      alert('Name and prompt are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const templateData = {
        name,
        description,
        prompt,
        isActive
      };
      
      const response = await fetch(`/api/prompts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });
      
      if (response.ok) {
        router.push('/admin/prompts');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template');
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
          <h1 className="text-2xl font-bold mb-4 text-white">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested template could not be found.</p>
          <Button asChild>
            <Link href="/admin/prompts">Back to Templates</Link>
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
            <Link href="/admin/prompts">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-white">Edit Prompt Template</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-white">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Technical Interview - Frontend"
                  className="bg-background text-white border-border"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose and use case of this template..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-20"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="prompt">Prompt Template</Label>
                  <span className="text-xs text-muted-foreground">
                    Use {'{placeholders}'} for dynamic content
                  </span>
                </div>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt template here..."
                  className="w-full p-3 border border-border rounded-md resize-none bg-background text-white h-64 font-mono text-sm"
                  required
                />
              </div>
              
              <div className="bg-muted/20 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Available Placeholders:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li><code className="bg-muted px-1 py-0.5 rounded text-xs">{'{role}'}</code> - Job role (e.g., "Frontend Developer")</li>
                      <li><code className="bg-muted px-1 py-0.5 rounded text-xs">{'{level}'}</code> - Experience level (e.g., "Senior", "Junior")</li>
                      <li><code className="bg-muted px-1 py-0.5 rounded text-xs">{'{techstack}'}</code> - Technologies (e.g., "React, TypeScript")</li>
                      <li><code className="bg-muted px-1 py-0.5 rounded text-xs">{'{amount}'}</code> - Number of questions to generate</li>
                      <li>You can also use custom placeholders that will be filled when generating questions</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive">Template is active and available for use</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
              {template.updatedAt && <p>Last updated: {new Date(template.updatedAt).toLocaleDateString()}</p>}
            </div>
            
            <div className="flex gap-3">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromptTemplatePage;
