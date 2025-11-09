import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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
  const isAdmin = user?.isAdmin || user?.role === 'admin' || false;
  const template = await getCompanyTemplateById(templateId, isAdmin);
  
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

  // Check if user is logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to start this interview round.</p>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Get or create company interview
  console.log(`Getting or creating company interview for user ${user.id} and template ${templateId}`);
  let userInterviews = await getCompanyInterviewsByUserId(user.id);
  let userInterview = userInterviews.find(interview => interview.templateId === templateId);
  
  if (!userInterview) {
    console.log(`No existing interview found for template ${templateId}, creating new one...`);
    const result = await createCompanyInterview(user.id, templateId, isAdmin);
    
    if (result.success && result.interviewId) {
      console.log(`Successfully created interview with ID: ${result.interviewId}`);
      // Refresh the interviews list
      userInterviews = await getCompanyInterviewsByUserId(user.id);
      userInterview = userInterviews.find(interview => interview.templateId === templateId);
    } else {
      console.error(`Failed to create interview: ${result.error || 'Unknown error'}`);
    }
  } else {
    console.log(`Found existing interview with ID: ${userInterview.id}`);
  }
  
  // At this point, userInterview should always have an ID because we've updated getCompanyInterviewsByUserId
  // to explicitly set the ID from the document ID. But let's add a safety check just in case.
  if (userInterview) {
    console.log(`Using interview with ID: ${userInterview.id} for template: ${userInterview.templateId}`);
    
    // If somehow the ID is still missing (which shouldn't happen with our updated code),
    // we'll create a new interview as a last resort
    if (!userInterview.id || userInterview.id === '') {
      console.error('Interview found but has no ID despite our fixes!');
      console.log('Creating a new interview as a fallback...');
      
      const result = await createCompanyInterview(user.id, templateId, isAdmin);
      if (result.success && result.interviewId) {
        console.log(`Created new interview with ID: ${result.interviewId}`);
        userInterviews = await getCompanyInterviewsByUserId(user.id);
        userInterview = userInterviews.find(interview => interview.templateId === templateId);
      } else {
        console.error(`Failed to create fallback interview: ${result.error || 'Unknown error'}`);
      }
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
  
  // Log interview details for debugging
  console.log('User interview found:', {
    interviewId: userInterview.id,
    templateId: userInterview.templateId,
    userId: userInterview.userId,
    completedRounds: userInterview.completedRounds
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <Card className="mb-6 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border-white/20 shadow-lg overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10 transition-colors">
            <Link href={`/companies/${templateId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white/20 to-white/5 flex items-center justify-center border border-white/30 shadow-md">
              <Image
                src={template.companyLogo}
                alt={`${template.companyName} logo`}
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                  {template.companyName}
                </span> - {round.name}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  {round.duration} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-primary" />
                  {round.type === 'voice' ? 'Voice Interview' : 
                   round.type === 'code' ? 'Coding Challenge' : 
                   round.type === 'aptitude' ? 'Aptitude Test' : 'Text Interview'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round Info */}
      <Card className="mb-8 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-white/20 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Round Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-medium mb-2 text-white">Round Type: {round.name}</h3>
            <p className="text-sm text-white/70">
              {round.type === 'voice' && 'This is a voice-based interview where you\'ll speak with an AI interviewer.'}
              {round.type === 'code' && 'This is a coding challenge where you\'ll solve programming problems.'}
              {round.type === 'text' && 'This is a text-based interview where you\'ll type your responses.'}
              {round.type === 'aptitude' && 'This is an aptitude test where you\'ll answer multiple-choice questions.'}
            </p>
          </div>
          
          {round.passingScore && (
            <div>
              <h3 className="font-medium mb-2 text-white">Passing Score: {round.passingScore}/100</h3>
              <p className="text-sm text-white/70">
                You need to score at least {round.passingScore} points to pass this round.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2 text-white">Sample Questions</h3>
            <ul className="text-sm text-white/70 space-y-1 list-none">
              {round.questions && round.questions.length > 0 ? (
                <>
                  {round.questions.slice(0, 3).map((question, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{typeof question === 'string' ? question : question.text}</span>
                    </li>
                  ))}
                  {round.questions.length > 3 && (
                    <li className="text-primary">... and {round.questions.length - 3} more questions</li>
                  )}
                </>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Questions will be loaded from question bank</span>
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Interview Component */}
      <Card className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-white/20 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <RoundInterviewWrapper
          roundType={round.type}
          questions={round.questions || []}
          duration={round.duration}
          interviewId={userInterview.id}
          userId={user?.id!}
          roundId={roundId}
          roundName={round.name}
          templateId={templateId}
          userName={user?.name}
          questionBankId={round.questionBankId}
          questionCount={round.questionCount}
          isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RoundInterviewPage;
