import React from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {getCurrentUser} from "@/lib/actions/auth.action";
import {getInterviewsByUserId, getLatestInterviews} from "@/lib/actions/general.action";
import {getCompanyInterviewsByUserId} from "@/lib/actions/company.action";
import {BarChart3, Users, TrendingUp, Clock, ArrowRight} from "lucide-react";

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

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Welcome Section */}
            <section className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-muted-foreground">
                    Ready to practice your interview skills? Choose from personalized interviews or company-specific templates.
                </p>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalInterviews}</p>
                            <p className="text-sm text-muted-foreground">Personal Interviews</p>
                        </div>
                    </div>
                </div>

                <div className="card-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalCompanyInterviews}</p>
                            <p className="text-sm text-muted-foreground">Company Interviews</p>
                        </div>
                    </div>
                </div>

                <div className="card-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalInterviews + totalCompanyInterviews}</p>
                            <p className="text-sm text-muted-foreground">Total Sessions</p>
                        </div>
                    </div>
                </div>

                <div className="card-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-muted-foreground">In Progress</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Create Custom Interview</h2>
                        <Image src="/robot.png" alt="AI Interview" width={48} height={48} />
                    </div>
                    <p className="text-muted-foreground mb-4">
                        Generate personalized interview questions based on your role, experience level, and tech stack.
                    </p>
                    <Button asChild className="btn-primary w-full">
                        <Link href="/interview" className="flex items-center gap-2">
                            Start Custom Interview
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>

                <div className="card-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Company Templates</h2>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                        Practice with real interview processes from Google, Amazon, Meta, and other top companies.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/companies" className="flex items-center gap-2">
                            Browse Company Interviews
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Personal Interviews</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/my-interviews">View All</Link>
                        </Button>
                    </div>
                    {recentInterviews.length > 0 ? (
                        <div className="space-y-3">
                            {recentInterviews.map((interview) => (
                                <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{interview.role} Interview</p>
                                        <p className="text-sm text-muted-foreground">{interview.type} • {interview.level}</p>
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
                </div>

                <div className="card-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Company Interviews</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/companies/progress">View All</Link>
                        </Button>
                    </div>
                    {recentCompanyInterviews.length > 0 ? (
                        <div className="space-y-3">
                            {recentCompanyInterviews.map((interview) => (
                                <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                </div>
            </section>
        </div>
    )
}
export default Page
