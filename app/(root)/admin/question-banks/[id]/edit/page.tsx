"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdAt: string;
  updatedAt?: string;
  questionIds: string[];
  isActive: boolean;
}

interface EditQuestionBankPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditQuestionBankPage = ({ params: paramsPromise }: EditQuestionBankPageProps) => {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    difficulty: 'mixed',
    isActive: true
  });

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const response = await fetch(`/api/question-banks/${id}`);
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
          setFormData({
            name: data.data.name,
            description: data.data.description,
            type: data.data.type,
            difficulty: data.data.difficulty,
            isActive: data.data.isActive
          });
        } else {
          toast.error('Failed to fetch question bank');
        }
      } catch (error) {
        console.error('Error fetching question bank:', error);
        toast.error('Error loading question bank');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/question-banks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          updatedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast.success('Question bank updated successfully');
        router.push('/admin/question-banks');
      } else {
        const error = await response.json();
        toast.error(`Failed to update: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating question bank:', error);
      toast.error('Error updating question bank');
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

  if (!bank) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Question Bank Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested question bank could not be found.</p>
              <Button asChild>
                <Link href="/admin/question-banks">Back to Question Banks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin/question-banks">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-white">Edit Question Bank</h1>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Bank Details</CardTitle>
          <CardDescription>Update the details of this question bank</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white">
                  Bank Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter bank name"
                  className="bg-background border-border text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium text-white">
                  Bank Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-white"
                  disabled
                >
                  <option value="aptitude">Aptitude</option>
                  <option value="code">Coding</option>
                  <option value="text">Text</option>
                  <option value="voice">Voice</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-white">
                  Difficulty Level
                </label>
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
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2 mt-8">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleToggleActive}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-white">
                    Active (available for use in templates)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-white">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter bank description"
                className="bg-background border-border text-white min-h-[100px]"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSaving}
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
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t border-border pt-4 flex justify-between">
          <Button
            variant="outline"
            asChild
            className="border-border text-white hover:bg-muted"
          >
            <Link href={`/admin/question-banks/${id}/questions`}>
              Manage Questions
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-border text-white hover:bg-muted"
          >
            <Link href={`/admin/question-banks/${id}/view-questions`}>
              View All Questions
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditQuestionBankPage;
