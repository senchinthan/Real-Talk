import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import {getRandomInterviewCover} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import {getFeedbackByInterviewId} from "@/lib/actions/general.action";

const InterviewCard = async ({
                           id,
                           userId,
                           role,
                           type,
                           techstack,
                           createdAt,
                           currentUserId,
                       }: InterviewCardProps) => {
    console.log('InterviewCard props:', { id, userId, role, type });
    
    const feedback = await getFeedbackByInterviewId({ interviewId: id, userId });
    
    console.log('InterviewCard feedback:', feedback);
    console.log('Feedback totalScore:', feedback?.totalScore, 'Type:', typeof feedback?.totalScore);
    console.log('Feedback keys:', feedback ? Object.keys(feedback) : 'No feedback');
    const normalizedType = /mix/gi.test(type) ? 'Mixed' : 'type';
    const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format('MMM D, YYYY');
    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96">
            <div className="card-interview">
                <div>
                    <div
                        className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg">
                        <p className="badge-text ">{normalizedType}</p>
                    </div>

                    <Image
                        src={getRandomInterviewCover()}
                        alt="cover-image"
                        width={90}
                        height={90}
                        className="rounded-full object-fit size-[90px]"
                    />

                    <h3 className="mt-5 capitalize">{role} Interview</h3>

                    <div className="flex flex-row gap-5 mt-3">
                        <div className="flex flex-row gap-2">
                            <Image
                                src="/calendar.svg"
                                width={22}
                                height={22}
                                alt="calendar"
                            />
                            <p>{formattedDate}</p>
                        </div>

                        <div className="flex flex-row gap-2 items-center">
                            <Image src="/star.svg" width={22} height={22} alt="star" />
                            <p>
                                {feedback?.totalScore !== undefined && feedback?.totalScore !== null 
                                    ? `${feedback.totalScore}/100` 
                                    : "---/100"
                                }
                            </p>
                        </div>
                    </div>

                    <p className="line-clamp-2 mt-5">
                        {feedback?.finalAssessment ||
                            "You haven't taken this interview yet. Take it now to improve your skills."}
                    </p>

                </div>
            </div>

            <div className="flex flex-row justify-between">
                <DisplayTechIcons techStack={techstack} />

                <div className="flex flex-row gap-2">
                    {feedback && currentUserId && (
                        <Button className="btn-secondary">
                            <Link href={`/interview/${id}/feedback`}>
                                View Feedback
                            </Link>
                        </Button>
                    )}
                    <Button className="btn-primary">
                        <Link
                            href={
                                feedback
                                    ? `/interview/${id}/feedback`
                                    : `/interview/${id}`
                            }
                        >
                            {feedback ? "Check Feedback" : "View Interview"}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>

    )
}
export default InterviewCard
