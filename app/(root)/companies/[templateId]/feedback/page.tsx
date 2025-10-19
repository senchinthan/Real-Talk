import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyTemplateById, getCompanyInterviewsByUserId, getCumulativeFeedback, getAllRoundFeedback } from '@/lib/actions/company.action';
import { ArrowLeft, Star, TrendingUp, TrendingDown, CheckCircle, Clock, Target, Award } from 'lucide-react';

interface CumulativeFeedbackProps {
  params: Promise<{ templateId: string }>;
}

const CumulativeFeedbackPage = async ({ params }: CumulativeFeedbackProps) => {
  const { templateId } = await params;
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

  // Get cumulative feedback
  const cumulativeFeedback = await getCumulativeFeedback(userInterview.id, user?.id!);
  const allRoundFeedback = await getAllRoundFeedback(userInterview.id, user?.id!);

  if (!cumulativeFeedback || cumulativeFeedback.completedRounds === 0) {
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

  const overallGrade = cumulativeFeedback.averageScore >= 90 ? 'A+' :
                      cumulativeFeedback.averageScore >= 80 ? 'A' :
                      cumulativeFeedback.averageScore >= 70 ? 'B' :
                      cumulativeFeedback.averageScore >= 60 ? 'C' : 'D';

  const gradeColor = cumulativeFeedback.averageScore >= 80 ? 'text-green-600' :
                     cumulativeFeedback.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600';

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
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Image
              src={template.companyLogo}
              alt={`${template.companyName} logo`}
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{template.companyName} - Overall Performance</h1>
            <p className="text-muted-foreground">Cumulative feedback across all completed rounds</p>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="card-border p-8 mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Star className="w-10 h-10 text-primary" />
          </div>
          <div>
            <div className="text-5xl font-bold text-primary mb-2">
              {cumulativeFeedback.averageScore}/100
            </div>
            <div className={`text-2xl font-bold ${gradeColor}`}>
              Grade: {overallGrade}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {cumulativeFeedback.completedRounds}
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
              {Math.round((cumulativeFeedback.completedRounds / template.rounds.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Round-by-Round Performance */}
      <div className="card-border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Round-by-Round Performance</h2>
        <div className="space-y-4">
          {template.rounds.map((round) => {
            const roundScore = cumulativeFeedback.roundScores.find(rs => rs.roundId === round.id);
            const isCompleted = roundScore !== undefined;
            const scoreColor = roundScore ? 
              (roundScore.score >= 80 ? 'text-green-600' : 
               roundScore.score >= 60 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400';

            return (
              <div key={round.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium">{round.name}</h3>
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
                        Attempt #{roundScore.attempt}
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
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Key Strengths</h2>
          </div>
          {cumulativeFeedback.overallStrengths.length > 0 ? (
            <div className="space-y-2">
              {cumulativeFeedback.overallStrengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800">{strength}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No specific strengths identified yet.</p>
          )}
        </div>

        <div className="card-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Areas for Improvement</h2>
          </div>
          {cumulativeFeedback.overallAreasForImprovement.length > 0 ? (
            <div className="space-y-2">
              {cumulativeFeedback.overallAreasForImprovement.map((area, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                  <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-orange-800">{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No specific areas for improvement identified.</p>
          )}
        </div>
      </div>

      {/* Detailed Assessment */}
      <div className="card-border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Overall Assessment</h2>
        <div className="prose max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            {cumulativeFeedback.finalAssessment}
          </p>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="card-border p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Hiring Recommendation</h2>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${
            cumulativeFeedback.averageScore >= 80 ? 'text-green-600' :
            cumulativeFeedback.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {cumulativeFeedback.averageScore >= 80 ? 'STRONG HIRE' :
             cumulativeFeedback.averageScore >= 70 ? 'HIRE' : 'NO HIRE'}
          </div>
          <p className="text-muted-foreground mb-4">
            {cumulativeFeedback.averageScore >= 80 ? 
              'Excellent performance across all rounds. Strong candidate for the role.' :
              cumulativeFeedback.averageScore >= 70 ?
              'Good performance with room for improvement. Consider for the role.' :
              'Performance below expectations. Consider additional preparation or different role.'
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {cumulativeFeedback.averageScore >= 80 ? '90%' : 
                 cumulativeFeedback.averageScore >= 70 ? '70%' : '30%'}
              </div>
              <div className="text-sm text-muted-foreground">Hire Probability</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {cumulativeFeedback.completedRounds >= template.rounds.length ? 'Complete' : 'In Progress'}
              </div>
              <div className="text-sm text-muted-foreground">Interview Status</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {overallGrade}
              </div>
              <div className="text-sm text-muted-foreground">Overall Grade</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href={`/companies/${templateId}`}>
            Back to Interview
          </Link>
        </Button>
        {cumulativeFeedback.completedRounds < template.rounds.length && (
          <Button asChild className="btn-primary">
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
