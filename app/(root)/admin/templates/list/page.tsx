"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Template {
  id: string;
  companyName: string;
  companyLogo?: string;
  description: string;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  rounds: Array<{
    id: string;
    name: string;
    type: 'voice' | 'text' | 'code' | 'aptitude';
    duration: number;
  }>;
}

const TemplatesListPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.data || []);
          setFilteredTemplates(data.data || []);
        } else {
          console.error('Failed to fetch templates');
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const filtered = templates.filter(template => 
      template.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  const togglePublishStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus })
      });

      if (response.ok) {
        setTemplates(templates.map(template => 
          template.id === templateId 
            ? { ...template, isPublished: !currentStatus } 
            : template
        ));
      } else {
        const error = await response.json();
        console.error('Failed to update template status:', error);
      }
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(template => template.id !== templateId));
      } else {
        const error = await response.json();
        console.error('Failed to delete template:', error);
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Company Templates</h1>
          <Button asChild>
            <Link href="/admin/templates/create">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Company Templates</h1>
          <p className="text-muted-foreground">
            Manage all company interview templates
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button asChild>
            <Link href="/admin/templates/create">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Link>
          </Button>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try a different search term' : 'Create your first template to get started'}
          </p>
          <Button asChild>
            <Link href="/admin/templates/create">
              <Plus className="w-4 h-4 mr-2" /> Create Template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.companyName}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={template.isActive ? 'default' : 'outline'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={template.isPublished ? 'default' : 'outline'} className="ml-1">
                      {template.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Rounds:</span>{' '}
                    {template.rounds.length} {template.rounds.length === 1 ? 'round' : 'rounds'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/admin/templates/${template.id}/edit`)}
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => togglePublishStatus(template.id, template.isPublished)}
                  >
                    {template.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" /> Publish
                      </>
                    )}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteTemplate(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesListPage;
