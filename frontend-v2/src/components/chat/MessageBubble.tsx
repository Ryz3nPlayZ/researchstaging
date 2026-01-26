/**
 * MessageBubble Component
 *
 * Displays individual chat messages with role-based styling.
 * Supports user, assistant, and system messages with different layouts.
 */

import React from 'react';

export type MessageRole = 'user' | 'assistant' | 'system';

interface MessageBubbleProps {
  message: string;
  role: MessageRole;
  timestamp?: string;
}

/**
 * MessageBubble component - displays a single chat message
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  role,
  timestamp,
}) => {
  // Format timestamp if provided
  const formatTime = (ts?: string): string => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // System message - centered, muted, no background
  if (role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="text-sm text-text-muted italic text-center max-w-md px-4">
          {message}
          {timestamp && (
            <div className="text-xs text-text-muted mt-1">
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User message - right-aligned, primary color, pill shape
  if (role === 'user') {
    return (
      <div className="flex justify-end my-3">
        <div className="flex flex-col items-end max-w-[70%]">
          <div
            className="
              px-4 py-2 rounded-2xl rounded-br-sm
              bg-[var(--color-primary)]
              text-white
              break-words
              shadow-sm
            "
          >
            <p className="whitespace-pre-wrap">{message}</p>
          </div>
          {timestamp && (
            <div className="text-xs text-text-muted mt-1 px-1">
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message - left-aligned, gray background, dark text
  return (
    <div className="flex justify-start my-3">
      <div className="flex flex-col items-start max-w-[70%]">
        <div
          className="
            px-4 py-2 rounded-2xl rounded-bl-sm
            bg-[var(--color-secondary)]
            text-[var(--color-text-primary)]
            break-words
            shadow-sm
          "
        >
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <div className="text-xs text-text-muted mt-1 px-1">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};
