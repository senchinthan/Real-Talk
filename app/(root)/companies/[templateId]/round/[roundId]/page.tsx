import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import RoundInterviewWrapper from '@/components/RoundInterviewWrapper';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyTemplateById, getCompanyInterviewsByUserId, createCompanyInterview } from '@/lib/actions/company.action';
import { ArrowLeft, Clock, Users } from 'lucide-react';

interface RoundInterviewProps {
  params: Promise<{ templateId: string; roundId: string }>;
}

const RoundInterviewPage = async ({ params }: RoundInterviewProps) => {
  const { templateId, roundId } = await params;
  const user = await getCurrentUser();
  const template = await getCompanyTemplateById(templateId);
  
  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested company template could not be found.</p>
          <Button asChild>
            <Link href="/companies">Back to Companies</Link>
          </Button>
        </div>
      </div>
    );
  }

  const round = template.rounds.find(r => r.id === roundId);
  if (!round) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Round Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested round could not be found.</p>
          <Button asChild>
            <Link href={`/companies/${templateId}`}>Back to {template.companyName}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get or create company interview
  let userInterviews = await getCompanyInterviewsByUserId(user?.id!);
  let userInterview = userInterviews.find(interview => interview.templateId === templateId);
  
  if (!userInterview) {
    const result = await createCompanyInterview(user?.id!, templateId);
    if (result.success && result.interviewId) {
      // Refresh the interviews list
      userInterviews = await getCompanyInterviewsByUserId(user?.id!);
      userInterview = userInterviews.find(interview => interview.templateId === templateId);
    }
  }

  if (!userInterview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">Could not create or find your interview session.</p>
          <Button asChild>
            <Link href={`/companies/${templateId}`}>Back to {template.companyName}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-muted">
          <Link href={`/companies/${templateId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Image
              src={template.companyLogo}
              alt={`${template.companyName} logo`}
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{template.companyName} - {round.name}</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {round.duration} minutes
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {round.type === 'voice' ? 'Voice Interview' : 
                 round.type === 'code' ? 'Coding Challenge' : 'Text Interview'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round Info */}
      <div className="card-border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">Round Information</h2>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium mb-2 text-white">Round Type: {round.name}</h3>
            <p className="text-sm text-muted-foreground">
              {round.type === 'voice' && 'This is a voice-based interview where you\'ll speak with an AI interviewer.'}
              {round.type === 'code' && 'This is a coding challenge where you\'ll solve programming problems.'}
              {round.type === 'text' && 'This is a text-based interview where you\'ll type your responses.'}
            </p>
          </div>
          
          {round.passingScore && (
            <div>
              <h3 className="font-medium mb-2 text-white">Passing Score: {round.passingScore}/100</h3>
              <p className="text-sm text-muted-foreground">
                You need to score at least {round.passingScore} points to pass this round.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2 text-white">Sample Questions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {round.questions.slice(0, 3).map((question, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{typeof question === 'string' ? question : question.text}</span>
                </li>
              ))}
              {round.questions.length > 3 && (
                <li className="text-primary">... and {round.questions.length - 3} more questions</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Interview Component */}
      <div className="card-border p-6">
        <RoundInterviewWrapper
          roundType={round.type}
          questions={round.questions}
          duration={round.duration}
          interviewId={userInterview.id}
          userId={user?.id!}
          roundId={roundId}
          roundName={round.name}
          templateId={templateId}
          userName={user?.name}
        />
      </div>
    </div>
  );
};

export default RoundInterviewPage;
