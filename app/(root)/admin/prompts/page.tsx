"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Search, AlertCircle, MessageSquare } from 'lucide-react';
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

const PromptTemplatesPage = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/prompts');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.data);
        } else {
          console.error('Failed to fetch prompt templates');
        }
      } catch (error) {
        console.error('Error fetching prompt templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/prompts/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleToggleActive = async (template: PromptTemplate) => {
    try {
      const response = await fetch(`/api/prompts/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !template.isActive
        })
      });
      
      if (response.ok) {
        setTemplates(templates.map(t => 
          t.id === template.id ? { ...t, isActive: !t.isActive } : t
        ));
      } else {
        alert('Failed to update template status');
      }
    } catch (error) {
      console.error('Error updating template status:', error);
      alert('Error updating template status');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = 
      filterActive === 'all' || 
      (filterActive === 'active' && template.isActive) || 
      (filterActive === 'inactive' && !template.isActive);
    return matchesSearch && matchesActive;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gemini AI Prompt Templates</h1>
            <p className="text-muted-foreground">Manage AI prompt templates for interview rounds</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/admin/prompts/create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Template
            </Link>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background text-white border-border"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 rounded-md border border-border bg-background text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Templates Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || filterActive !== 'all'
                  ? "No templates match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't added any prompt templates yet. Click 'Add New Template' to get started."}
              </p>
              {(searchTerm || filterActive !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-border text-white"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterActive('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-medium text-white">{template.name}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          template.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{template.description}</p>
                      
                      <div className="bg-muted/20 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-white mb-1">Prompt Template:</h4>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {template.prompt.length > 200 
                            ? template.prompt.substring(0, 200) + '...' 
                            : template.prompt}
                        </pre>
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                        {template.updatedAt && ` • Updated: ${new Date(template.updatedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2 sm:gap-3 items-center sm:items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-border text-white hover:bg-muted"
                      >
                        <Link href={`/admin/prompts/${template.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleActive(template)}
                        className={`border-border ${
                          template.isActive 
                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                            : 'text-green-400 hover:bg-green-500/10 hover:text-green-300'
                        }`}
                      >
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(template.id)}
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

export default PromptTemplatesPage;
