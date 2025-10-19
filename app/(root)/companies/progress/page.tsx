import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getCompanyInterviewsByUserId, getCumulativeFeedback } from '@/lib/actions/company.action';
import { getCompanyTemplateById } from '@/lib/actions/company.action';
import { CheckCircle, Clock, Star, TrendingUp, ArrowRight } from 'lucide-react';

const CompaniesProgressPage = async () => {
  const user = await getCurrentUser();
  const companyInterviews = await getCompanyInterviewsByUserId(user?.id!);

  // Get cumulative feedback for each interview
  const interviewsWithFeedback = await Promise.all(
    companyInterviews.map(async (interview) => {
      const cumulativeFeedback = await getCumulativeFeedback(interview.id, user?.id!);
      const template = await getCompanyTemplateById(interview.templateId);
      return {
        ...interview,
        cumulativeFeedback,
        template
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Company Interview Progress</h1>
          <p className="text-muted-foreground">
            Track your progress across different company interview processes.
          </p>
        </div>
        <Button asChild className="btn-primary">
          <Link href="/companies" className="flex items-center gap-2">
            Browse Companies
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {companyInterviews.length > 0 ? (
        <div className="space-y-6">
          {interviewsWithFeedback.map((interview) => {
            const progressPercentage = Math.round(
              (interview.completedRounds.length / (interview.template?.rounds.length || 1)) * 100
            );
            const averageScore = interview.cumulativeFeedback?.averageScore || 0;

            return (
              <div key={interview.id} className="card-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Image
                        src={interview.template?.companyLogo || '/companies/default.png'}
                        alt={`${interview.companyName} logo`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{interview.companyName} Interview</h3>
                      <p className="text-muted-foreground">
                        {interview.completedRounds.length} of {interview.template?.rounds.length || 0} rounds completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-2xl font-bold">{averageScore}/100</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Rounds Status */}
                <div className="mb-4">
                  <h4 className="font-medium mb-3">Rounds Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {interview.template?.rounds.map((round) => {
                      const isCompleted = interview.completedRounds.includes(round.id);
                      const roundScore = interview.cumulativeFeedback?.roundScores.find(
                        rs => rs.roundId === round.id
                      );

                      return (
                        <div key={round.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{round.name}</p>
                            {roundScore && (
                              <p className="text-xs text-muted-foreground">
                                {roundScore.score}/100
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Summary */}
                {interview.cumulativeFeedback && interview.cumulativeFeedback.completedRounds > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Performance Summary</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Completed Rounds:</span>
                        <span className="ml-2 font-medium">
                          {interview.cumulativeFeedback.completedRounds}/{interview.cumulativeFeedback.totalRounds}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average Score:</span>
                        <span className="ml-2 font-medium">{interview.cumulativeFeedback.averageScore}/100</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`ml-2 font-medium ${
                          interview.cumulativeFeedback.averageScore >= 70 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {interview.cumulativeFeedback.averageScore >= 70 ? 'On Track' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button asChild className="btn-primary flex-1">
                    <Link href={`/companies/${interview.templateId}`}>
                      {interview.completedRounds.length > 0 ? 'Continue Interview' : 'Start Interview'}
                    </Link>
                  </Button>
                  {interview.cumulativeFeedback && interview.cumulativeFeedback.completedRounds > 0 && (
                    <Button asChild variant="outline">
                      <Link href={`/companies/${interview.templateId}/feedback`}>
                        View Detailed Feedback
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Company Interviews Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start practicing with company-specific interview templates to track your progress.
          </p>
          <Button asChild className="btn-primary">
            <Link href="/companies">Browse Company Templates</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompaniesProgressPage;
