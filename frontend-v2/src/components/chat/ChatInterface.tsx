/**
 * ChatInterface Component
 *
 * Reusable chat UI with message list and input area.
 * Handles message display, auto-scroll, and user input.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

/**
 * ChatInterface component - message list with input area
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Handle keyboard (Ctrl+Enter to submit, Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim());
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      {/* Message List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm mt-2">Type your message below to begin planning your research.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg.content}
                  role={msg.role}
                  timestamp={msg.timestamp}
                />
              ))}
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start my-3">
                  <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-[var(--color-secondary)]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          <div className="flex items-end space-x-3">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Ctrl+Enter to send)"
                disabled={isLoading}
                rows={1}
                className="
                  w-full px-4 py-3
                  bg-[var(--color-background)]
                  border border-[var(--color-border)]
                  rounded-lg
                  text-[var(--color-text-primary)]
                  placeholder-[var(--color-text-muted)]
                  resize-none
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
                style={{
                  minHeight: '48px',
                  maxHeight: '200px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="
                px-6 py-3
                bg-[var(--color-primary)]
                text-white
                rounded-lg
                font-medium
                hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-opacity duration-200
                whitespace-nowrap
              "
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Press Ctrl+Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
};
