import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getCompanyTemplateById, getCompanyInterviewsByUserId, getCumulativeFeedback } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { Clock, CheckCircle, Circle, Star } from 'lucide-react';

interface CompanyDashboardProps {
  params: Promise<{ templateId: string }>;
}

const CompanyDashboard = async ({ params }: CompanyDashboardProps) => {
  const { templateId } = await params;
  const user = await getCurrentUser();
  const template = await getCompanyTemplateById(templateId);
  const userInterviews = await getCompanyInterviewsByUserId(user?.id!);

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

  // Find user's interview for this template
  const userInterview = userInterviews.find(interview => interview.templateId === templateId);
  const cumulativeFeedback = userInterview ? await getCumulativeFeedback(userInterview.id, user?.id!) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          <h1 className="text-3xl font-bold">{template.companyName} Interview</h1>
          <p className="text-muted-foreground">{template.description}</p>
        </div>
      </div>

      {/* Progress Overview */}
      {userInterview && (
        <div className="card-border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {userInterview.completedRounds.length}/{template.rounds.length}
              </div>
              <div className="text-sm text-muted-foreground">Rounds Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {cumulativeFeedback?.averageScore || 0}/100
              </div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round((userInterview.completedRounds.length / template.rounds.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Rounds List */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Interview Rounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.rounds.map((round, index) => {
            const isCompleted = userInterview?.completedRounds.includes(round.id) || false;
            const roundScore = cumulativeFeedback?.roundScores.find(rs => rs.roundId === round.id);

            return (
              <div key={round.id} className="card-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold">{round.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {round.duration} minutes
                      </div>
                    </div>
                  </div>
                  {roundScore && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{roundScore.score}/100</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    round.type === 'voice' ? 'bg-blue-100 text-blue-800' :
                    round.type === 'code' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {round.type === 'voice' ? 'Voice Interview' :
                     round.type === 'code' ? 'Coding Challenge' : 'Text Interview'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {isCompleted ? (
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/companies/${templateId}/round/${round.id}/feedback`}>
                        View Feedback
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="btn-primary flex-1">
                      <Link href={`/companies/${templateId}/round/${round.id}`}>
                        {userInterview ? 'Continue' : 'Start Round'}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative Feedback */}
      {cumulativeFeedback && cumulativeFeedback.completedRounds > 0 && (
        <div className="card-border p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Average Score</span>
                <span className="text-lg font-bold">{cumulativeFeedback.averageScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cumulativeFeedback.averageScore}%` }}
                ></div>
              </div>
            </div>

            {cumulativeFeedback.overallStrengths.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Key Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {cumulativeFeedback.overallStrengths.slice(0, 5).map((strength, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cumulativeFeedback.overallAreasForImprovement.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Areas for Improvement</h3>
                <div className="flex flex-wrap gap-2">
                  {cumulativeFeedback.overallAreasForImprovement.slice(0, 5).map((area, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button asChild className="btn-primary">
                <Link href={`/companies/${templateId}/feedback`}>
                  View Detailed Feedback
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Start Interview Button */}
      {!userInterview && (
        <div className="text-center">
          <Button asChild size="lg" className="btn-primary">
            <Link href={`/companies/${templateId}/round/${template.rounds[0].id}`}>
              Start {template.companyName} Interview
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
