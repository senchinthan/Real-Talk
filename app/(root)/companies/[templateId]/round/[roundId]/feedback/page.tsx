import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyTemplateById, getCompanyInterviewsByUserId, getRoundFeedback, markRoundComplete } from '@/lib/actions/company.action';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

interface RoundFeedbackProps {
  params: Promise<{ templateId: string; roundId: string }>;
}

const RoundFeedbackPage = async ({ params }: RoundFeedbackProps) => {
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

  // Get user's interview for this template
  const userInterviews = await getCompanyInterviewsByUserId(user?.id!);
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
  const feedback = await getRoundFeedback(userInterview.id, roundId, user?.id!);
  
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

  // Mark round as completed if not already
  if (!userInterview.completedRounds.includes(roundId)) {
    await markRoundComplete(userInterview.id, roundId);
  }

  const isPassing = round.passingScore ? feedback.totalScore >= round.passingScore : true;
  const scoreColor = feedback.totalScore >= 80 ? 'text-green-600' : 
                    feedback.totalScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/companies/${templateId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Image
              src={template.companyLogo}
              alt={`${template.companyName} logo`}
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{template.companyName} - {round.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {round.duration} minutes
              </div>
              <div className="flex items-center gap-1">
                {isPassing ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
                {isPassing ? 'Passed' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="card-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Round Performance</h2>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {feedback.totalScore}/100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Category Scores</h3>
            <div className="space-y-3">
              {feedback.categoryScores.map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm font-bold">{category.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.score >= 80 ? 'bg-green-500' :
                        category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${category.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{category.comment}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Round Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700">Strengths</span>
                </div>
                <ul className="space-y-1">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-700">Areas for Improvement</span>
                </div>
                <ul className="space-y-1">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-sm text-orange-600 flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Assessment */}
      <div className="card-border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Detailed Assessment</h2>
        <div className="prose max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            {feedback.finalAssessment}
          </p>
        </div>
      </div>

      {/* Round Information */}
      <div className="card-border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Round Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Round Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Type:</span>
                <span>{round.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{round.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attempt:</span>
                <span>#{feedback.attempt || 1}</span>
              </div>
              {round.passingScore && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span>{round.passingScore}/100</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Performance Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Score:</span>
                <span className={scoreColor}>{feedback.totalScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={isPassing ? 'text-green-600' : 'text-orange-600'}>
                  {isPassing ? 'Passed' : 'Needs Improvement'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href={`/companies/${templateId}/round/${roundId}`}>
            Retake Round
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/companies/${templateId}`}>
            Back to {template.companyName}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default RoundFeedbackPage;
