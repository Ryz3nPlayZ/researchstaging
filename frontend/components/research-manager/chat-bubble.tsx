import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";

interface ChatBubbleProps {
    role: 'ai' | 'user';
    content: string;
    isTyping?: boolean;
}

export function ChatBubble({ role, content, isTyping }: ChatBubbleProps) {
    if (role === 'ai') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 max-w-[85%]"
            >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1C7C54] flex items-center justify-center text-white shadow-sm mt-1">
                    <Sparkles size={16} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 ml-1">Research Manager</p>
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800 leading-relaxed relative">
                        {isTyping ? (
                            <div className="flex gap-1 h-5 items-center px-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        ) : (
                            content
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm mt-1">
                <User size={16} />
            </div>
            <div className="space-y-1 text-right">
                <div className="bg-[#1C7C54] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm text-sm leading-relaxed text-left">
                    {content}
                </div>
            </div>
        </motion.div>
    );
}
