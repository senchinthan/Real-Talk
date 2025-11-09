"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Search, AlertCircle, FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface AptitudeQuestionBank {
  id: string;
  name: string;
  description: string;
  type: 'aptitude';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdAt: string;
  updatedAt?: string;
  questionIds: string[];
  isActive: boolean;
}

const AptitudeBanksPage = () => {
  const [banks, setBanks] = useState<AptitudeQuestionBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('/api/aptitude-banks');
        if (response.ok) {
          const data = await response.json();
          setBanks(data.data);
        } else {
          console.error('Failed to fetch aptitude question banks');
        }
      } catch (error) {
        console.error('Error fetching aptitude question banks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const handleDelete = async (bankId: string) => {
    if (!confirm('Are you sure you want to delete this question bank? All questions in this bank will be inaccessible.')) return;
    
    try {
      const response = await fetch(`/api/aptitude-banks/${bankId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBanks(banks.filter(bank => bank.id !== bankId));
      } else {
        alert('Failed to delete question bank');
      }
    } catch (error) {
      console.error('Error deleting question bank:', error);
      alert('Error deleting question bank');
    }
  };

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = 
      filterDifficulty === 'all' || bank.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Aptitude Question Banks</h1>
            <p className="text-muted-foreground">Create and manage aptitude question banks</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/admin/aptitude-banks/create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Question Bank
            </Link>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search question banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background text-white border-border"
            />
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 rounded-md border border-border bg-background text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        {/* Question Banks List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading question banks...</p>
          </div>
        ) : filteredBanks.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Question Banks Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || filterDifficulty !== 'all'
                  ? "No question banks match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't created any aptitude question banks yet. Click 'Create Question Bank' to get started."}
              </p>
              {(searchTerm || filterDifficulty !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-border text-white"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDifficulty('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBanks.map((bank) => (
              <Card key={bank.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <FileQuestion className="w-5 h-5 text-primary" />
                        <span className="font-medium text-white">{bank.name}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getDifficultyColor(bank.difficulty)}`}>
                          {bank.difficulty.charAt(0).toUpperCase() + bank.difficulty.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{bank.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{bank.questionIds.length} questions</span>
                        <span>•</span>
                        <span>Created: {new Date(bank.createdAt).toLocaleDateString()}</span>
                        {bank.updatedAt && (
                          <>
                            <span>•</span>
                            <span>Updated: {new Date(bank.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-border text-white hover:bg-muted"
                      >
                        <Link href={`/admin/aptitude-banks/${bank.id}/questions`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Questions
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-border text-white hover:bg-muted"
                      >
                        <Link href={`/admin/aptitude-banks/${bank.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(bank.id)}
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

export default AptitudeBanksPage;
