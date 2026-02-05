import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Send, X, Bot, User, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import api from '../../lib/api';

export const AISidebar = () => {
  const { selectedProject, selectedDocument } = useProject();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Load collapse state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('ai-sidebar-collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save collapse state to localStorage
  const handleToggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('ai-sidebar-collapsed', JSON.stringify(newState));
  }, [isCollapsed]);

  // Load chat history on mount or project change
  const loadHistory = useCallback(async () => {
    if (!selectedProject) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/chat/projects/${selectedProject.id}/history`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending || !selectedProject) return;

    const message = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Build context
    const context = {};
    if (selectedDocument) {
      context.document_id = selectedDocument.id;
    }

    // Optimistically add user message
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      context
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.post(`/chat/projects/${selectedProject.id}/send`, {
        message,
        context
      });

      // Replace optimistic message with server response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        return [
          ...withoutTemp,
          response.data.user_message,
          response.data.ai_response
        ];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
      // Focus textarea after sending
      if (textareaRef.current && !isCollapsed) {
        textareaRef.current.focus();
      }
    }
  }, [inputText, isSending, selectedProject, selectedDocument, isCollapsed]);

  // Clear chat history
  const handleClearHistory = useCallback(async () => {
    if (!selectedProject) return;

    try {
      await api.delete(`/chat/projects/${selectedProject.id}/history`);
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear chat history');
    }
  }, [selectedProject]);

  // Handle Enter key (send) vs Shift+Enter (newline)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Auto-resize textarea
  const handleInput = useCallback((e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, []);

  if (!selectedProject) {
    return null;
  }

  if (isCollapsed) {
    // Collapsed state - show only icon strip
    return (
      <div className="w-16 border-l bg-background flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          title="Expand AI Assistant"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Bot className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-[400px] border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            title="Clear chat history"
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCollapse}
            title="Collapse"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Ask me anything about your research</p>
            <p className="text-xs mt-2">I have access to your project context, documents, and findings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] max-h-[150px]"
            disabled={isSending}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            size="icon"
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
