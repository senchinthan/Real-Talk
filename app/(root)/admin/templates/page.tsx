"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Template {
  id: string;
  companyName: string;
  companyLogo?: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rounds: Array<{
    id: string;
    name: string;
    type: 'voice' | 'text' | 'code' | 'aptitude';
    duration: number | null;
  }>;
}

const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Pass isAdmin=true to get all templates including inactive ones
        const response = await fetch('/api/companies?isAdmin=true');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.data || []);
        } else {
          console.error('Failed to fetch templates');
          toast.error('Failed to fetch templates');
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Error fetching templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const toggleActiveStatus = async (templateId: string, currentStatus: boolean) => {
    // Find the template name for the toast message
    const template = templates.find(t => t.id === templateId);
    const templateName = template?.companyName || 'Template';
    
    // Show loading toast
    const toastId = toast.loading(`${currentStatus ? 'Deactivating' : 'Activating'} ${templateName}...`);
    
    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        // Update local state
        setTemplates(templates.map(template => 
          template.id === templateId 
            ? { ...template, isActive: !currentStatus } 
            : template
        ));
        
        // Show success toast
        toast.success(
          `${templateName} ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
          { id: toastId }
        );
      } else {
        const error = await response.json();
        console.error('Failed to update template status:', error);
        
        // Show error toast
        toast.error(
          `Failed to ${currentStatus ? 'deactivate' : 'activate'} ${templateName}`, 
          { id: toastId }
        );
      }
    } catch (error) {
      console.error('Error updating template status:', error);
      
      // Show error toast
      toast.error(
        `Error ${currentStatus ? 'deactivating' : 'activating'} ${templateName}`, 
        { id: toastId }
      );
    }
  };

  const deleteTemplate = async (templateId: string) => {
    // Find the template name for the toast message
    const template = templates.find(t => t.id === templateId);
    const templateName = template?.companyName || 'Template';
    
    if (!confirm(`Are you sure you want to delete ${templateName}? This action cannot be undone.`)) {
      return;
    }

    // Show loading toast
    const toastId = toast.loading(`Deleting ${templateName}...`);
    
    try {
      const response = await fetch(`/api/companies/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if the response has content before trying to parse it as JSON
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete template';
        try {
          // Try to parse error response if it's JSON
          const errorData = responseText ? JSON.parse(responseText) : {};
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use the raw text or status text
          errorMessage = responseText || response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // If successful, update the templates list
      setTemplates(templates.filter(template => template.id !== templateId));
      
      // Show success toast
      toast.success(`${templateName} deleted successfully`, { id: toastId });
    } catch (error) {
      console.error('Error deleting template:', error);
      
      // Show error toast
      toast.error(
        `Failed to delete ${templateName}: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        { id: toastId }
      );
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <div className="w-full md:w-auto">
          <Button asChild>
            <Link href="/admin/templates/create" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Link>
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started
          </p>
          <Button asChild>
            <Link href="/admin/templates/create">
              <Plus className="w-4 h-4 mr-2" /> Create Template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
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
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={template.isActive ? 'This template is visible to users and can be used for interviews' : 'This template is only visible to admins'}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
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
                    onClick={() => toggleActiveStatus(template.id, template.isActive)}
                    className={template.isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}
                    title={template.isActive ? "Make this template unavailable to users" : "Make this template available to users for interviews"}
                  >
                    {template.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" /> Activate
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

export default AdminTemplatesPage;
