/**
 * ConversationalPlanning Page
 *
 * Chat-based planning flow where Router Agent gathers context
 * through iterative clarification before generating the research plan.
 *
 * Route: /plan
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { ChatInterface, ChatMessage } from '../components/chat/ChatInterface';
import { PlanReviewCard } from '../components/chat/PlanReviewCard';
import { startPlanning, sendMessage, generatePlan } from '../services/planning';
import { createProject } from '../services/projects';
import { useProjectStore } from '../stores/useProjectStore';
import type { PlanSummaryData } from '../components/chat/PlanReviewCard';

/**
 * ConversationalPlanning component
 */
export const ConversationalPlanning: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveProject } = useProjectStore();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get research goal from navigation state
  const researchGoal = location.state?.research_goal as string | undefined;

  // Initialize planning session on mount
  useEffect(() => {
    const initializePlanning = async () => {
      if (!researchGoal?.trim()) {
        setError('No research goal provided. Please start from the home dashboard.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Start planning session
        const session = await startPlanning(researchGoal.trim());

        // Set session ID
        setSessionId(session.session_id);

        // Add initial assistant message
        const initialMessage: ChatMessage = {
          role: 'assistant',
          content: session.initial_message,
          timestamp: new Date().toISOString(),
        };
        setMessages([initialMessage]);
      } catch (err) {
        console.error('Failed to start planning:', err);
        setError('Failed to start planning session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializePlanning();
  }, [researchGoal]);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!sessionId) {
      setError('No active planning session. Please restart.');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setError(null);

    try {
      // Send message to backend
      const response = await sendMessage(sessionId, message);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Check if planning is complete
      if (response.is_complete && response.plan_summary) {
        setPlanSummary(response.plan_summary);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');

      // Add error message
      const errorMessage: ChatMessage = {
        role: 'system',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirming the plan
  const handleConfirmPlan = async () => {
    if (!planSummary || !sessionId) {
      setError('No plan to confirm. Please complete the planning flow first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate final plan
      const researchPlan = await generatePlan(sessionId);

      // Create project
      const createRequest = {
        research_goal: planSummary.research_goal,
        output_type: planSummary.output_type as any,
        audience: planSummary.audience,
      };

      const response = await createProject(createRequest);

      // Set active project in store
      // TODO: Fetch full project details after creation
      setActiveProject({
        id: response.project_id,
        research_goal: planSummary.research_goal,
        output_type: planSummary.output_type,
        audience: planSummary.audience,
        status: response.status,
        task_counts: {
          total: 0,
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          blocked: 0,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Navigate to project workspace
      navigate(`/project/${response.project_id}`);
    } catch (err) {
      console.error('Failed to confirm plan:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle revising the plan
  const handleRevisePlan = () => {
    // Hide plan review card
    setPlanSummary(null);

    // User can continue conversation
    // Focus will return to chat input automatically
  };

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-4">
          <h1
            className="text-2xl font-bold"
            style={{
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-family)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            Plan Your Research
          </h1>
          <p
            className="text-sm mt-1"
            style={{
              color: 'var(--color-text-secondary)',
            }}
          >
            Chat with our AI to create a personalized research plan
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mb-4 p-4 rounded-lg border border-[var(--color-error)] bg-[var(--color-error)] bg-opacity-10"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Plan Review Card */}
        {planSummary && !isLoading && (
          <div className="flex-shrink-0 mt-4">
            <PlanReviewCard
              planSummary={planSummary}
              onConfirm={handleConfirmPlan}
              onRevise={handleRevisePlan}
            />
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
};
