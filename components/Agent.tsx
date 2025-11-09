"use client";

import Image from "next/image";
import {cn} from "@/lib/utils";
import {redirect, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import { vapi } from "@/lib/vapi.sdk";
import {interviewer} from "@/constants";

interface AgentProps {
    userName: string;
    userId: string;
    type?: string;
    interviewId: string;
    questions?: string[];
    roundId?: string;
    roundName?: string;
    templateId?: string;
};

interface Message {
    type: string;
    role: 'user' | 'system' | 'assistant';
    transcript?: string;
    transcriptType?: 'final' | 'partial';
}

enum CallStatus {
    INACTIVE= "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const Agent = ({ userName, userId, type, interviewId, questions, roundId, roundName, templateId }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => {
            console.log("Call ended normally");
            setCallStatus(CallStatus.FINISHED);
        };

        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final' && message.transcript) {
                const newMessage: SavedMessage = { 
                    role: message.role, 
                    content: message.transcript 
                };

                setMessages((prev) => [...prev, newMessage]);
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => {
            console.log("Error:", error);
            
            // Handle meeting ejection errors
            if (error.message?.includes("Meeting has ended") || 
                error.message?.includes("ejection")) {
                console.log("Meeting ended due to ejection - handling gracefully");
                setCallStatus(CallStatus.FINISHED);
                
                // Add a system message to explain what happened
                const systemMessage: SavedMessage = {
                    role: 'system',
                    content: 'The interview has ended. Your responses have been saved.'
                };
                setMessages((prev) => [...prev, systemMessage]);
            }
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError);
        }
    }, [])

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log('Generate Feedback here', { interviewId, userId, messagesCount: messages.length });

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interviewId: interviewId!,
                    userId: userId!,
                    transcript: messages,
                    ...(roundId && { roundId }),
                    ...(roundName && { roundName })
                })
            });

            console.log('Feedback API response status:', response.status);
            const result = await response.json();
            console.log('Feedback API response:', result);

            if (result.success && result.feedbackId) {
                if (roundId) {
                    // For company interviews, we need to get the template ID from the interview
                    // For now, redirect to the company dashboard
                    router.push(`/companies/${interviewId}`);
                } else {
                    // For regular interviews, redirect to general feedback
                    router.push(`/interview/${interviewId}/feedback`);
                }
            } else {
                console.log('error saving feedback:', result);
                redirect('/');
            }
        } catch (error) {
            console.error('Error calling feedback API:', error);
            redirect('/');
        }
    }

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED){
            if(type==='generate'){
                router.push('/');
            }
            else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, type, userId, interviewId, roundId, roundName, templateId, router]);

    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const MAX_RECONNECT_ATTEMPTS = 3;
    
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        
        try {
            if(type==='generate'){
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    }
                });
            }
            else{
                let formattedQuestions = '';

                if(questions && questions.length > 0) {
                    console.log(`Formatting ${questions.length} questions for Vapi interviewer`);
                    formattedQuestions = questions
                        .map((question)=> `- ${question}`)
                        .join('\n');
                } else {
                    console.log('No questions provided, using default questions');
                    formattedQuestions = `- Tell me about your background and experience.
- What are your strengths and weaknesses?
- Why are you interested in this role?
- Describe a challenging project you worked on.
- Do you have any questions for me?`;
                }

                console.log('Starting Vapi interview with questions:', formattedQuestions);
                await vapi.start(interviewer, {
                    variableValues: {
                        questions: formattedQuestions,
                    }
                });
            }
            
            // Reset connection attempts on successful connection
            setConnectionAttempts(0);
        } catch (error) {
            console.error("Error starting call:", error);
            
            // Attempt to reconnect if we haven't exceeded max attempts
            if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                setConnectionAttempts(prev => prev + 1);
                
                // Add a system message about reconnection
                const reconnectMessage: SavedMessage = {
                    role: 'system',
                    content: `Connection issue detected. Attempting to reconnect... (Attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
                };
                setMessages(prev => [...prev, reconnectMessage]);
                
                // Wait briefly before trying again
                setTimeout(() => handleCall(), 2000);
            } else {
                // We've exceeded reconnection attempts
                setCallStatus(CallStatus.FINISHED);
                const failedMessage: SavedMessage = {
                    role: 'system',
                    content: 'Unable to establish a stable connection. Please try again later.'
                };
                setMessages(prev => [...prev, failedMessage]);
            }
        }

    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    }

    const latestmessage= messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="profile-image"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.png"
                            alt="profile-image"
                            width={539}
                            height={539}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={latestmessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fadeIn opacity-100"
                            )}
                        >
                            {latestmessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== "ACTIVE" ? (
                    <button className="relative btn-call" onClick={handleCall}>
                        <span className={cn("absolute animate-ping rounded-full opacity-75", callStatus !== "CONNECTING" && "hidden")}
                        />

                        <span>
                            {isCallInactiveOrFinished ? 'Call' : '. . .'}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}
export default Agent
