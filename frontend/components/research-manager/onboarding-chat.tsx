'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectApi } from '@/lib/api';
import { ChatBubble } from './chat-bubble';
import { Button } from '@/components/ui/button';
import { Send, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'ai' | 'user';
    content: string;
}

interface OnboardingChatProps {
    onComplete?: () => void;
}

type OnboardingStep = 'GREETING' | 'GOAL_INPUT' | 'CLARIFICATION' | 'CONFIRMATION' | 'CREATING';

export function OnboardingChat({ onComplete }: OnboardingChatProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: "Hello! I'm your Research Manager. I'm here to help you set up a new research project. To get started, briefly describe what you'd like to research today." }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [step, setStep] = useState<OnboardingStep>('GOAL_INPUT');
    const [researchGoal, setResearchGoal] = useState('');
    const [outputType, setOutputType] = useState('literature_review');
    const [audience, setAudience] = useState('academic');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // State Machine Logic
        if (step === 'GOAL_INPUT') {
            setResearchGoal(inputValue);
            // Simulate AI "thinking" and clarifying
            setTimeout(() => {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: "That sounds like an interesting topic. To help me structure the workspace, what kind of output are you aiming for? (e.g., A Literature Review, a Research Paper, or just an Analysis Report?)"
                };
                setMessages(prev => [...prev, aiMsg]);
                setStep('CLARIFICATION');
                setIsTyping(false);
            }, 1000);
        } else if (step === 'CLARIFICATION') {
            // Simple heuristic to detect type (MVP)
            const lowerInput = inputValue.toLowerCase();
            let detectedType = 'literature_review';
            if (lowerInput.includes('paper')) detectedType = 'research_paper';
            else if (lowerInput.includes('report') || lowerInput.includes('analysis')) detectedType = 'analysis_report';
            else if (lowerInput.includes('thesis')) detectedType = 'thesis_chapter';

            setOutputType(detectedType);

            setTimeout(() => {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: `Got it. I'll set this up as a ${detectedType.replace('_', ' ')}. Lastly, who is the primary audience for this work?`
                };
                setMessages(prev => [...prev, aiMsg]);
                setStep('CONFIRMATION');
                setIsTyping(false);
            }, 800);
        } else if (step === 'CONFIRMATION') {
            setAudience(inputValue);
            setTimeout(() => {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    content: "Perfect. I have everything I need. Creating your research workspace now..."
                };
                setMessages(prev => [...prev, aiMsg]);
                setStep('CREATING');
                setIsTyping(false);
                createProject(researchGoal, outputType, inputValue);
            }, 800);
        }
    };

    const createProject = async (goal: string, type: string, aud: string) => {
        try {
            const res = await projectApi.create({
                research_goal: goal,
                output_type: type,
                audience: aud,
            });

            if (res.data) {
                // Determine redirect path
                const projectId = res.data.id;
                setTimeout(() => {
                    onComplete?.();
                    router.push(`/projects/${projectId}`);
                }, 1500);
            } else {
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: "I encountered an error creating the project. Please try again."
                };
                setMessages(prev => [...prev, errorMsg]);
                setStep('GOAL_INPUT'); // Reset to try again?
            }
        } catch (e) {
            console.error(e);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'ai',
                content: "An unexpected error occurred."
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-gray-50/50 rounded-3xl border border-gray-200 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1C7C54] animate-pulse"></div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Research Manager</h2>
                        <p className="text-xs text-gray-500">AI Assistant • Online</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                    <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
                ))}
                {isTyping && <ChatBubble role="ai" content="" isTyping={true} />}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={step === 'CREATING' ? 'Setting up workspace...' : "Type your reply..."}
                        disabled={step === 'CREATING' || isTyping}
                        className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1C7C54]/20 focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputValue.trim() || step === 'CREATING' || isTyping}
                        className="rounded-xl bg-[#1C7C54] hover:bg-[#1B512D] text-white w-12 h-11 shrink-0 transition-all"
                    >
                        <ArrowRight size={20} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
