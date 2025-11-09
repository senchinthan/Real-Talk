import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyTemplateById, getCompanyInterviewsByUserId } from '@/lib/actions/company.action';
import { getRoundFeedback } from '@/lib/actions/feedback.action';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { RoundFeedback } from '@/types';

interface RoundFeedbackProps {
  params: Promise<{ templateId: string; roundId: string }>;
}

const RoundFeedbackPage = async ({ params }: RoundFeedbackProps) => {
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

  const round = template.rounds.find((r: any) => r.id === roundId);
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
          <p className="text-muted-foreground mb-4">Please sign in to view your feedback.</p>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Get user's interview for this template
  const userInterviews = await getCompanyInterviewsByUserId(user.id);
  const userInterview = userInterviews.find(interview => interview.templateId === templateId);
  
  if (!userInterview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Interview Not Found</h1>
          <p className="text-muted-foreground mb-4">You haven't started this interview yet.</p>
          <Button asChild>
            <Link href={`/companies/${templateId}`}>Start Interview</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get feedback for this round
  const feedback = await getRoundFeedback(userInterview.id, roundId, user?.id!) as RoundFeedback | null;
  
  if (!feedback) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Feedback Available</h1>
          <p className="text-muted-foreground mb-4">Feedback for this round is not available yet.</p>
          <Button asChild>
            <Link href={`/companies/${templateId}/round/${roundId}`}>Take Round</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Determine pass/fail status and colors
  const isPassed = feedback.passed;
  const statusColor = isPassed ? 'text-green-600' : 'text-red-600';
  const statusBgColor = isPassed ? 'bg-green-100' : 'bg-red-100';
  const StatusIcon = isPassed ? CheckCircle : XCircle;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/companies/${templateId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        
        <div className="flex items-center gap-4">
          {template.companyLogo && (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Image
                src={template.companyLogo}
                alt={`${template.companyName} logo`}
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{template.companyName} - {round.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {round.duration} minutes
              </div>
              <Badge variant={isPassed ? "default" : "destructive"} className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                <span>{isPassed ? 'PASSED' : 'FAILED'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center justify-center">
              <div className={`text-6xl font-bold mb-2 ${statusColor}`}>
                {feedback.score}/100
              </div>
              <Badge variant={isPassed ? "success" : "destructive"} className="text-sm px-3 py-1">
                {isPassed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white">Your Score:</span>
                  <span className="font-bold text-white">{feedback.score}/100</span>
                </div>
                <Progress value={feedback.score} className="h-2 mb-4 bg-primary/20" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white">Passing Score:</span>
                  <span className="font-bold text-white">{feedback.passingScore}/100</span>
                </div>
                <Progress value={feedback.passingScore} className="h-2 bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Round Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Round Type:</span>
              <span className="text-white">{feedback.roundType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="text-white">{round.duration} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attempt:</span>
              <span className="text-white">#{feedback.attempt || 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span className="text-white">{new Date(feedback.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answer Summary */}
      <Card className="mb-8 bg-card border-border w-full">
        <CardHeader>
          <CardTitle className="text-white">Answer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Questions Answered:</span>
              <span className="font-bold text-white">{feedback.answers?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Correct Answers:</span>
              <span className="font-bold text-white">
                {feedback.answers?.filter(a => a.isCorrect).length || 0} / {feedback.answers?.length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status Banner */}
      <Card className={`mb-8 w-full ${isPassed ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${statusColor}`} />
            <div>
              <h3 className={`font-semibold text-lg ${statusColor}`}>
                {isPassed ? 'Round Passed' : 'Round Failed'}
              </h3>
              <p className="text-muted-foreground">
                {isPassed 
                  ? `Congratulations! You passed the ${round.name} round with a score of ${feedback.score}%.` 
                  : `You did not pass the ${round.name} round. Required score: ${feedback.passingScore}%, Your score: ${feedback.score}%.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Button asChild variant="outline" className="border-border text-white hover:bg-muted">
          <Link href={`/companies/${templateId}/round/${roundId}`}>
            Retake Round
          </Link>
        </Button>
        <Button asChild variant="secondary" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Link href={`/companies/${templateId}`}>
            Back to Interview
          </Link>
        </Button>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/companies/${templateId}/feedback`}>
            View Overall Feedback
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default RoundFeedbackPage;
