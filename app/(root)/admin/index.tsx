"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  Code, 
  FileQuestion, 
  FileEdit, 
  Settings, 
  Users,
  BarChart,
  Plus,
  List,
  PenTool,
  Home
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [counts, setCounts] = useState({
    aptitudeQuestions: 0,
    codingQuestions: 0,
    textQuestions: 0,
    promptTemplates: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch counts from APIs
        const [aptitudeRes, codingRes, textRes, promptsRes] = await Promise.all([
          fetch('/api/aptitude'),
          fetch('/api/coding'),
          fetch('/api/text-banks').then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })),
          fetch('/api/prompts')
        ]);

        const aptitudeData = await aptitudeRes.json();
        const codingData = await codingRes.json();
        const textData = textRes.data ? textRes : { data: [] };
        const promptsData = await promptsRes.json();

        setCounts({
          aptitudeQuestions: aptitudeData.data?.length || 0,
          codingQuestions: codingData.data?.length || 0,
          textQuestions: textData.data?.length || 0,
          promptTemplates: promptsData.data?.length || 0
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const primaryModules = [
    {
      title: 'Aptitude Question Banks',
      description: 'Create and manage aptitude question banks',
      icon: <FileQuestion className="w-10 h-10 text-primary" />,
      link: '/admin/aptitude-banks',
      count: counts.aptitudeQuestions,
      actions: [
        { label: 'View Banks', icon: <List className="w-4 h-4" />, href: '/admin/aptitude-banks' },
        { label: 'Create Bank', icon: <Plus className="w-4 h-4" />, href: '/admin/aptitude-banks/create' }
      ]
    },
    {
      title: 'Coding Question Banks',
      description: 'Create and manage coding question banks with test cases',
      icon: <Code className="w-10 h-10 text-primary" />,
      link: '/admin/coding-banks',
      count: counts.codingQuestions,
      actions: [
        { label: 'View Banks', icon: <List className="w-4 h-4" />, href: '/admin/coding-banks' },
        { label: 'Create Bank', icon: <Plus className="w-4 h-4" />, href: '/admin/coding-banks/create' }
      ]
    },
    {
      title: 'Text Question Banks',
      description: 'Create and manage text interview question banks',
      icon: <PenTool className="w-10 h-10 text-primary" />,
      link: '/admin/text-banks',
      count: counts.textQuestions,
      actions: [
        { label: 'View Banks', icon: <List className="w-4 h-4" />, href: '/admin/text-banks' },
        { label: 'Create Bank', icon: <Plus className="w-4 h-4" />, href: '/admin/text-banks/create' }
      ]
    },
    {
      title: 'AI Prompt Templates',
      description: 'Manage Gemini AI interview prompts',
      icon: <MessageSquare className="w-10 h-10 text-primary" />,
      link: '/admin/prompts',
      count: counts.promptTemplates,
      actions: [
        { label: 'View All', icon: <List className="w-4 h-4" />, href: '/admin/prompts' },
        { label: 'Add New', icon: <Plus className="w-4 h-4" />, href: '/admin/prompts/create' }
      ]
    },
    {
      title: 'Interview Templates',
      description: 'Manage company interview templates',
      icon: <FileEdit className="w-10 h-10 text-primary" />,
      link: '/admin/templates',
      count: null,
      actions: [
        { label: 'View All', icon: <List className="w-4 h-4" />, href: '/admin/templates' },
        { label: 'Add New', icon: <Plus className="w-4 h-4" />, href: '/admin/templates/create' }
      ]
    }
  ];
  
  const secondaryModules = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="w-6 h-6 text-primary" />,
      link: '/admin/users'
    },
    {
      title: 'Analytics',
      description: 'View interview statistics',
      icon: <BarChart className="w-6 h-6 text-primary" />,
      link: '/admin/analytics'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: <Settings className="w-6 h-6 text-primary" />,
      link: '/admin/settings'
    }
  ];

  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <Home className="w-4 h-4" /> },
    { name: "Aptitude Banks", href: "/admin/aptitude-banks", icon: <FileQuestion className="w-4 h-4" /> },
    { name: "Coding Banks", href: "/admin/coding-banks", icon: <Code className="w-4 h-4" /> },
    { name: "Text Banks", href: "/admin/text-banks", icon: <PenTool className="w-4 h-4" /> },
    { name: "Prompts", href: "/admin/prompts", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "Templates", href: "/admin/templates", icon: <FileEdit className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-white">Admin Dashboard</h1>
          
          {/* Navigation Bar */}
          <div className="bg-card border border-border rounded-lg p-1 mb-8 overflow-x-auto">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const isActive = 
                  item.href === "/admin" 
                    ? pathname === "/admin" 
                    : pathname?.startsWith(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-white"}`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg">Manage your interview system content and settings</p>
        </div>
        
        {/* Main Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {primaryModules.map((module, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    {module.icon}
                  </div>
                  {module.count !== null && (
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {isLoading ? 'Loading...' : `${module.count} items`}
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold mt-4 text-white">{module.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{module.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {module.actions.map((action, actionIndex) => (
                    <Button 
                      key={actionIndex} 
                      variant={actionIndex === 0 ? "outline" : "default"}
                      className={actionIndex === 0 ? "border-border text-white hover:bg-muted" : "bg-primary hover:bg-primary/90"}
                      asChild
                    >
                      <Link href={action.href}>
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Quick Links */}
        <h2 className="text-xl font-semibold mb-4 text-white">Additional Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {secondaryModules.map((module, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href={module.link} className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{module.title}</h3>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Quick Stats */}
        <Card className="bg-card border-border mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <FileQuestion className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aptitude Questions</p>
                  <p className="text-2xl font-bold text-white">{isLoading ? '...' : counts.aptitudeQuestions}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coding Challenges</p>
                  <p className="text-2xl font-bold text-white">{isLoading ? '...' : counts.codingQuestions}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <PenTool className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Text Questions</p>
                  <p className="text-2xl font-bold text-white">{isLoading ? '...' : counts.textQuestions}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Prompt Templates</p>
                  <p className="text-2xl font-bold text-white">{isLoading ? '...' : counts.promptTemplates}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
