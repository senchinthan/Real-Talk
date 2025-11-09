import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { getCompanyTemplateById, getCompanyInterviewsByUserId, getCumulativeFeedback } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { Clock, CheckCircle, Circle, Star, Building2, TrendingUp, Target, Award } from 'lucide-react';

interface CompanyDashboardProps {
  params: Promise<{ templateId: string }>;
}

const CompanyDashboard = async ({ params }: CompanyDashboardProps) => {
  const { templateId } = await params;
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin || user?.role === 'admin' || false;
  const template = await getCompanyTemplateById(templateId, isAdmin);
  
  // Only fetch user interviews if user is logged in
  const userInterviews = user ? await getCompanyInterviewsByUserId(user.id) : [];

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
            <p className="text-muted-foreground mb-6">The requested company template could not be found.</p>
            <Button asChild>
              <Link href="/companies">Back to Companies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find user's interview for this template
  const userInterview = userInterviews.find(interview => interview.templateId === templateId);
  const cumulativeFeedback = userInterview ? await getCumulativeFeedback(userInterview.id, user?.id!) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <Card className="mb-8 bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20">
              <Image
                src={template.companyLogo}
                alt={`${template.companyName} logo`}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-white">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                {template.companyName} Interview
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">{template.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      {userInterview && (
        <Card className="mb-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {userInterview.completedRounds.length}/{template.rounds.length}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Rounds Completed</div>
                <Progress 
                  value={(userInterview.completedRounds.length / template.rounds.length) * 100} 
                  className="h-2"
                />
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {cumulativeFeedback?.averageScore || 0}/100
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Average Score</div>
                <Progress 
                  value={cumulativeFeedback?.averageScore || 0} 
                  className="h-2"
                />
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {Math.round((userInterview.completedRounds.length / template.rounds.length) * 100)}%
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <Progress 
                  value={(userInterview.completedRounds.length / template.rounds.length) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rounds List */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2 text-white">
          <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          Interview Rounds
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {template.rounds.map((round, index) => {
            const isCompleted = userInterview?.completedRounds.includes(round.id) || false;
            const roundScore = cumulativeFeedback?.roundScores.find(rs => rs.roundId === round.id);

            return (
              <Card key={round.id} className={`transition-all duration-200 hover:shadow-md bg-card border-border ${
                isCompleted ? 'ring-2 ring-green-500/50 bg-green-500/10' : ''
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base sm:text-lg text-white">{round.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {round.duration} minutes
                        </CardDescription>
                      </div>
                    </div>
                    {roundScore && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-white">{roundScore.score}/100</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        round.type === 'voice' ? 'default' :
                        round.type === 'code' ? 'secondary' :
                        round.type === 'aptitude' ? 'outline' : 'secondary'
                      }
                      className="text-xs bg-muted text-muted-foreground"
                    >
                      {round.type === 'voice' ? 'Voice Interview' :
                       round.type === 'code' ? 'Coding Challenge' :
                       round.type === 'aptitude' ? 'Aptitude Test' : 'Text Interview'}
                    </Badge>
                    {round.passingScore && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        Pass: {round.passingScore}%
                      </Badge>
                    )}
                  </div>

                  <Separator className="bg-border" />

                  <div className="flex gap-2">
                    {isCompleted ? (
                      <Button asChild variant="outline" className="flex-1 border-border text-white hover:bg-muted">
                        <Link href={`/companies/${templateId}/round/${round.id}/feedback`}>
                          View Feedback
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href={`/companies/${templateId}/round/${round.id}`}>
                          {userInterview ? 'Continue' : 'Start Round'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cumulative Feedback */}
      {cumulativeFeedback && cumulativeFeedback.completedRounds > 0 && (
        <Card className="mb-8 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Award className="w-5 h-5" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">Average Score</span>
                <span className="text-lg font-bold text-white">{cumulativeFeedback.averageScore}/100</span>
              </div>
              <Progress 
                value={cumulativeFeedback.averageScore} 
                className="h-3"
              />
            </div>

            {cumulativeFeedback.overallStrengths.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2 text-white">
                  <Star className="w-4 h-4 text-green-500" />
                  Key Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cumulativeFeedback.overallStrengths.slice(0, 5).map((strength, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {cumulativeFeedback.overallAreasForImprovement.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2 text-white">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Areas for Improvement
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cumulativeFeedback.overallAreasForImprovement.slice(0, 5).map((area, index) => (
                    <Badge key={index} variant="outline" className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-border" />

            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={`/companies/${templateId}/feedback`}>
                  View Detailed Feedback
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Interview Button */}
      {!userInterview && (
        <Card className="text-center bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-white">Ready to Start?</h3>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Begin your {template.companyName} interview journey with {template.rounds.length} comprehensive rounds.
              </p>
              <Button asChild size="lg" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={`/companies/${templateId}/round/${template.rounds[0].id}`}>
                  Start {template.companyName} Interview
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyDashboard;
