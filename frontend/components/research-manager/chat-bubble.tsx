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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
            >
                <div className="max-w-[75%] bg-white border border-gray-150 px-3.5 py-2.5 rounded-2xl rounded-tl-md shadow-xs text-sm text-gray-800 leading-relaxed">
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
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end"
        >
            <div className="max-w-[75%] bg-[var(--color-accent-500)] text-white px-3.5 py-2.5 rounded-2xl rounded-tr-md shadow-xs text-sm leading-relaxed">
                {content}
            </div>
        </motion.div>
    );
}
