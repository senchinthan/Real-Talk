import React from 'react';
import InterviewCard from '@/components/InterviewCard';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getInterviewsByUserId } from '@/lib/actions/general.action';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const MyInterviewsPage = async () => {
  const user = await getCurrentUser();
  const userInterviews = await getInterviewsByUserId(user?.id!);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Interviews</h1>
          <p className="text-muted-foreground">
            View and manage all your interview sessions and feedback.
          </p>
        </div>
        <Button asChild className="btn-primary">
          <Link href="/interview" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Interview
          </Link>
        </Button>
      </div>

      <div className="interviews-section">
        {userInterviews && userInterviews.length > 0 ? (
          userInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't taken any interviews yet. Create your first interview to get started.
            </p>
            <Button asChild className="btn-primary">
              <Link href="/interview">Create Your First Interview</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInterviewsPage;
