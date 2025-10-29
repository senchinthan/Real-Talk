import React from 'react'
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getInterviewsByUserId, getLatestInterviews, getFeedbackByInterviewId} from "@/lib/actions/general.action";
import {getCompanyInterviewsByUserId, getCumulativeFeedback} from "@/lib/actions/company.action";
import {BarChart3, Users, TrendingUp, Clock, ArrowRight, Plus} from "lucide-react";

const Page = async () => {
    const user = await getCurrentUser();

    const [userInterviews, latestInterviews, companyInterviews] = await Promise.all([
        getInterviewsByUserId(user?.id!),
        getLatestInterviews({ userId: user?.id! }),
        getCompanyInterviewsByUserId(user?.id!)
    ]);

    const totalInterviews = userInterviews?.length || 0;
    const totalCompanyInterviews = companyInterviews?.length || 0;
    const recentInterviews = userInterviews?.slice(0, 3) || [];
    const recentCompanyInterviews = companyInterviews?.slice(0, 3) || [];
    
    // Calculate average score from feedback
    let totalScore = 0;
    let scoreCount = 0;
    
    // Get feedback for personal interviews
    for (const interview of userInterviews || []) {
        try {
            const feedback = await getFeedbackByInterviewId({ 
                interviewId: interview.id, 
                userId: user?.id! 
            });
            if (feedback && feedback.totalScore) {
                totalScore += feedback.totalScore;
                scoreCount++;
            }
        } catch (error) {
            console.error('Error fetching feedback for interview:', interview.id, error);
        }
    }
    
    // Get feedback for company interviews (round feedback)
    for (const interview of companyInterviews || []) {
        try {
            const cumulativeFeedback = await getCumulativeFeedback(interview.id, user?.id!);
            if (cumulativeFeedback && cumulativeFeedback.averageScore) {
                totalScore += cumulativeFeedback.averageScore;
                scoreCount++;
            }
        } catch (error) {
            console.error('Error fetching cumulative feedback for company interview:', interview.id, error);
        }
    }
    
    const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="mb-8">
                <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold mb-4">Get Interview-Ready with AI-Powered Practice & Feedback</h1>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Master your interview skills with personalized practice and real company processes
                                </p>
                                <div className="flex gap-4">
                                    <Button asChild size="lg" className="btn-primary">
                                        <Link href="/interview" className="flex items-center gap-2">
                                            <Plus className="w-5 h-5" />
                                            Create Custom Interview
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href="/companies" className="flex items-center gap-2">
                                            <Users className="w-5 h-5" />
                                            Browse Company Templates
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden md:block ml-8">
                                <Image 
                                    src="/robot.png" 
                                    alt="AI Interview Assistant" 
                                    width={200} 
                                    height={200}
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Welcome Section */}
            <section className="mb-8">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Welcome back, {user?.name}!</h2>
                    <p className="text-muted-foreground">
                        Ready to practice your interview skills? Choose from personalized interviews or company-specific templates.
                    </p>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Personal Interviews</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/my-interviews">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentInterviews.length > 0 ? (
                            <div className="space-y-3">
                                {recentInterviews.map((interview) => (
                                    <div key={interview.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{interview.role} Interview</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{interview.type}</Badge>
                                                <Badge variant="outline">{interview.level}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/interview/${interview.id}`}>View</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No recent interviews</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Company Interviews</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/companies/progress">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentCompanyInterviews.length > 0 ? (
                            <div className="space-y-3">
                                {recentCompanyInterviews.map((interview) => (
                                    <div key={interview.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{interview.companyName} Interview</p>
                                            <p className="text-sm text-muted-foreground">
                                                {interview.completedRounds.length} rounds completed
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/companies/${interview.templateId}`}>View</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No recent company interviews</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Progress Stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalInterviews}</p>
                                <p className="text-sm text-muted-foreground">Personal Interviews</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCompanyInterviews}</p>
                                <p className="text-sm text-muted-foreground">Company Interviews</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalInterviews + totalCompanyInterviews}</p>
                                <p className="text-sm text-muted-foreground">Total Sessions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{averageScore}/100</p>
                                <p className="text-sm text-muted-foreground">Average Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}
export default Page
