"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TextQuestionBank {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionIds: string[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export default function EditTextBankPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use() with proper typing
  const unwrappedParams = use(params as any) as { id: string };
  const id = unwrappedParams.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bank, setBank] = useState<TextQuestionBank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'mixed',
    isActive: true
  });

  useEffect(() => {
    const fetchBank = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/text-banks/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setBank(data.data);
          setFormData({
            name: data.data.name,
            description: data.data.description || '',
            difficulty: data.data.difficulty,
            isActive: data.data.isActive
          });
        } else {
          console.error('Failed to fetch text question bank');
          toast.error('Failed to load text question bank');
          router.push('/admin/text-banks');
        }
      } catch (error) {
        console.error('Error fetching text question bank:', error);
        toast.error('Error loading text question bank');
        router.push('/admin/text-banks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Bank name is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/text-banks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Question bank updated successfully');
        router.push('/admin/text-banks');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update question bank');
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Question Bank Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested question bank could not be found.</p>
          <Button onClick={() => router.push('/admin/text-banks')}>
            Back to Text Banks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/text-banks')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Edit Question Bank</h1>
        </div>
        
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Edit your text question bank</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Frontend Developer Interview Questions"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the purpose and content of this question bank"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/text-banks')}
                  disabled={isSaving}
                  className="border-border text-white hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="flex items-center">
                  {isSaving ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
