import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyTemplateById, getCompanyInterviewsByUserId } from '@/lib/actions/company.action';
import { getCompanyFeedback, getAllRoundFeedback } from '@/lib/actions/feedback.action';
import { ArrowLeft, Star, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, Target, Award } from 'lucide-react';
import { CompanyFeedback, RoundFeedback } from '@/types';

interface CumulativeFeedbackProps {
  params: Promise<{ templateId: string }>;
}

const CumulativeFeedbackPage = async ({ params }: CumulativeFeedbackProps) => {
  const { templateId } = await params;
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

  // Check if user is logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your interview feedback.</p>
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

  // Get company feedback
  const companyFeedback = await getCompanyFeedback(userInterview.id, user?.id!) as CompanyFeedback | null;
  const allRoundFeedback = await getAllRoundFeedback(userInterview.id, user?.id!) as RoundFeedback[];

  if (!companyFeedback || companyFeedback.completedRounds === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Feedback Available</h1>
          <p className="text-muted-foreground mb-4">Complete at least one round to see cumulative feedback.</p>
          <Button asChild>
            <Link href={`/companies/${templateId}`}>Back to Interview</Link>
          </Button>
        </div>
      </div>
    );
  }

  const overallGrade = companyFeedback.averageScore >= 90 ? 'A+' :
                      companyFeedback.averageScore >= 80 ? 'A' :
                      companyFeedback.averageScore >= 70 ? 'B' :
                      companyFeedback.averageScore >= 60 ? 'C' : 'D';

  const gradeColor = companyFeedback.averageScore >= 80 ? 'text-green-600' :
                     companyFeedback.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600';

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
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Image
                src={template.companyLogo}
                alt={`${template.companyName} logo`}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{template.companyName} - Overall Performance</h1>
            <p className="text-muted-foreground">Cumulative feedback across all completed rounds</p>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="mb-8 bg-card border-border w-full">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
              <Star className="w-10 h-10 text-primary" />
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">
                {companyFeedback.averageScore}/100
              </div>
              <div className={`text-2xl font-bold ${gradeColor}`}>
                Grade: {overallGrade}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {companyFeedback.completedRounds}
              </div>
              <div className="text-sm text-muted-foreground">Rounds Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {template.rounds.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round((companyFeedback.completedRounds / template.rounds.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round-by-Round Performance */}
      <Card className="mb-8 bg-card border-border w-full">
        <CardHeader>
          <CardTitle className="text-white">Round-by-Round Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.rounds.map((round: any) => {
            const roundScore = companyFeedback.roundScores.find(rs => rs.roundId === round.id);
            const isCompleted = roundScore !== undefined;
            const scoreColor = roundScore ? 
              (roundScore.score >= 80 ? 'text-green-600' : 
               roundScore.score >= 60 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400';

            return (
              <div key={round.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium text-white">{round.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {round.type === 'voice' ? 'Voice Interview' : 
                       round.type === 'code' ? 'Coding Challenge' : 'Text Interview'} • {round.duration} min
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isCompleted ? (
                    <div>
                      <div className={`text-xl font-bold ${scoreColor}`}>
                        {roundScore.score}/100
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {roundScore.passed ? 'Passed' : 'Failed'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div className="text-xl font-bold">--</div>
                      <div className="text-sm">Not Started</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <CardTitle className="text-white">Key Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {companyFeedback.strengths.length > 0 ? (
              <div className="space-y-2">
                {companyFeedback.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-green-400">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific strengths identified yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-white">Areas for Improvement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {companyFeedback.areasForImprovement.length > 0 ? (
              <div className="space-y-2">
                {companyFeedback.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-orange-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-400">{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific areas for improvement identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Assessment */}
      <Card className="mb-8 bg-card border-border w-full">
        <CardHeader>
          <CardTitle className="text-white">Overall Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {companyFeedback.finalAssessment}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hiring Recommendation */}
      <Card className="mb-8 bg-card border-border w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-primary" />
            <CardTitle className="text-white">Hiring Recommendation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              companyFeedback.averageScore >= 80 ? 'text-green-600' :
              companyFeedback.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {companyFeedback.averageScore >= 80 ? 'STRONG HIRE' :
               companyFeedback.averageScore >= 70 ? 'HIRE' : 'NO HIRE'}
            </div>
            <p className="text-muted-foreground mb-4">
              {companyFeedback.averageScore >= 80 ? 
                'Excellent performance across all rounds. Strong candidate for the role.' :
                companyFeedback.averageScore >= 70 ?
                'Good performance with room for improvement. Consider for the role.' :
                'Performance below expectations. Consider additional preparation or different role.'
              }
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {companyFeedback.averageScore >= 80 ? '90%' : 
                   companyFeedback.averageScore >= 70 ? '70%' : '30%'}
                </div>
                <div className="text-sm text-muted-foreground">Hire Probability</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {companyFeedback.completedRounds >= template.rounds.length ? 'Complete' : 'In Progress'}
                </div>
                <div className="text-sm text-muted-foreground">Interview Status</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {overallGrade}
                </div>
                <div className="text-sm text-muted-foreground">Overall Grade</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Button asChild variant="outline" className="border-border text-white hover:bg-muted">
          <Link href={`/companies/${templateId}`}>
            Back to Interview
          </Link>
        </Button>
        {companyFeedback.completedRounds < template.rounds.length && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={`/companies/${templateId}`}>
              Continue Interview
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CumulativeFeedbackPage;
