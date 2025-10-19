"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Star, Play, Eye } from 'lucide-react';

interface CompanyInterviewCardProps {
  id: string;
  templateId: string;
  companyName: string;
  companyLogo: string;
  completedRounds: string[];
  totalRounds: number;
  averageScore?: number;
  createdAt: string;
  rounds: Array<{
    id: string;
    name: string;
    type: 'voice' | 'text' | 'code';
    duration: number;
    passingScore?: number;
  }>;
  roundScores?: Array<{
    roundId: string;
    roundName: string;
    score: number;
    attempt: number;
  }>;
}

const CompanyInterviewCard = ({
  id,
  templateId,
  companyName,
  companyLogo,
  completedRounds,
  totalRounds,
  averageScore,
  createdAt,
  rounds,
  roundScores = []
}: CompanyInterviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const progressPercentage = Math.round((completedRounds.length / totalRounds) * 100);
  const isCompleted = completedRounds.length === totalRounds;
  
  const getRoundStatus = (roundId: string) => {
    const isCompleted = completedRounds.includes(roundId);
    const roundScore = roundScores.find(rs => rs.roundId === roundId);
    
    return {
      isCompleted,
      score: roundScore?.score,
      attempt: roundScore?.attempt || 0
    };
  };

  const getNextIncompleteRound = () => {
    return rounds.find(round => !completedRounds.includes(round.id));
  };

  const nextRound = getNextIncompleteRound();

  return (
    <div className="card-border w-full max-w-2xl">
      <div className="card-interview p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Image
                src={companyLogo}
                alt={`${companyName} logo`}
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{companyName} Interview</h3>
              <p className="text-sm text-muted-foreground">
                {completedRounds.length} of {totalRounds} rounds completed
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {averageScore !== undefined && (
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-lg font-bold">{averageScore}/100</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {isCompleted ? 'Completed' : 'In Progress'}
            </div>
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
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Rounds Preview */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {rounds.slice(0, 3).map((round) => {
              const status = getRoundStatus(round.id);
              return (
                <div key={round.id} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {status.isCompleted ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={status.isCompleted ? 'text-green-700' : 'text-gray-600'}>
                    {round.name}
                  </span>
                  {status.score && (
                    <span className="text-green-600 font-medium">
                      ({status.score})
                    </span>
                  )}
                </div>
              );
            })}
            {rounds.length > 3 && (
              <div className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                +{rounds.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-4"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show All Rounds
            </>
          )}
        </Button>

        {/* Expanded Rounds List */}
        {isExpanded && (
          <div className="space-y-3 mb-4">
            {rounds.map((round) => {
              const status = getRoundStatus(round.id);
              return (
                <div key={round.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {status.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium">{round.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {round.type === 'voice' ? 'Voice Interview' : 
                         round.type === 'code' ? 'Coding Challenge' : 'Text Interview'} • {round.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {status.isCompleted ? (
                      <div>
                        <div className="font-bold text-green-600">
                          {status.score}/100
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attempt #{status.attempt}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <div className="font-bold">--</div>
                        <div className="text-xs">Not Started</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {nextRound ? (
            <Button asChild className="btn-primary flex-1">
              <Link href={`/companies/${templateId}/round/${nextRound.id}`} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {completedRounds.length === 0 ? 'Start Interview' : 'Continue'}
              </Link>
            </Button>
          ) : (
            <Button asChild className="btn-primary flex-1">
              <Link href={`/companies/${templateId}/feedback`} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Feedback
              </Link>
            </Button>
          )}
          
          <Button asChild variant="outline">
            <Link href={`/companies/${templateId}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInterviewCard;
