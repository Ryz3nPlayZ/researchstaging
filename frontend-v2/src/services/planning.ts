/**
 * Planning API Service
 *
 * Handles conversational planning flow where Router Agent
 * gathers context through iterative clarification before
 * generating the research plan.
 */

import { api } from './api';

/**
 * Planning session created when user starts planning
 */
export interface PlanningSession {
  session_id: string;
  initial_message: string;
  conversation_id: string;
}

/**
 * Response from sending a message in planning conversation
 */
export interface PlanningResponse {
  response: string;
  is_complete: boolean;
  plan_summary?: PlanSummary;
}

/**
 * Plan summary returned when planning is complete
 */
export interface PlanSummary {
  research_goal: string;
  output_type: string;
  audience: string;
  phases: string[];
}

/**
 * Phase in the research plan
 */
export interface Phase {
  phase_id: string;
  name: string;
  description: string;
  order: number;
  tasks: string[];
}

/**
 * Complete research plan ready for execution
 */
export interface ResearchPlan {
  plan_id: string;
  phases: Phase[];
  tasks: string[];
  estimated_credits: number;
}

/**
 * Request to start planning session
 */
interface StartPlanningRequest {
  research_goal: string;
}

/**
 * Request to send message in planning conversation
 */
interface SendMessageRequest {
  message: string;
}

/**
 * Start a new planning session
 *
 * POST /api/planning/start
 *
 * @param researchGoal - User's research goal
 * @returns Planning session with initial message from Router Agent
 */
export async function startPlanning(
  researchGoal: string
): Promise<PlanningSession> {
  const request: StartPlanningRequest = {
    research_goal: researchGoal,
  };

  // TODO: Replace with actual API call when backend is ready
  // return api.post<PlanningSession>('/planning/start', request);

  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        session_id: `session_${Date.now()}`,
        initial_message: `Great! I'd be happy to help you plan your research on "${researchGoal}".\n\nTo create the best research plan for you, I need to understand a few things:\n\n1. What type of output are you looking for? (blog post, research paper, technical report, presentation)\n\n2. Who is your target audience?\n\n3. Are there any specific aspects or angles you'd like me to focus on?`,
        conversation_id: `conv_${Date.now()}`,
      });
    }, 500);
  });
}

/**
 * Send a message in the planning conversation
 *
 * POST /api/planning/{sessionId}/message
 *
 * @param sessionId - Planning session ID
 * @param message - User's message
 * @returns Response from Router Agent with plan summary if complete
 */
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<PlanningResponse> {
  const request: SendMessageRequest = {
    message,
  };

  // TODO: Replace with actual API call when backend is ready
  // return api.post<PlanningResponse>(`/planning/${sessionId}/message`, request);

  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate planning completion after a few messages
      const isComplete = message.toLowerCase().includes('done') ||
                        message.toLowerCase().includes('that\'s all') ||
                        message.toLowerCase().includes('ready');

      if (isComplete) {
        resolve({
          response: 'Perfect! I have all the information I need. Let me generate your research plan...',
          is_complete: true,
          plan_summary: {
            research_goal: 'Understanding the impact of AI on scientific research',
            output_type: 'research_paper',
            audience: 'Academic researchers and policy makers',
            phases: [
              'Literature Review and Background Research',
              'Data Collection and Analysis',
              'Case Studies and Interviews',
              'Synthesis and Recommendations',
              'Draft and Revision',
            ],
          },
        });
      } else {
        resolve({
          response: `Thank you for that information. Let me ask a follow-up question to better understand your needs.\n\nCould you tell me more about the timeline for this research? Are there any specific deadlines or constraints I should be aware of?`,
          is_complete: false,
        });
      }
    }, 1000);
  });
}

/**
 * Generate the final research plan
 *
 * POST /api/planning/{sessionId}/generate
 *
 * @param sessionId - Planning session ID
 * @returns Complete research plan with phases and tasks
 */
export async function generatePlan(
  sessionId: string
): Promise<ResearchPlan> {
  // TODO: Replace with actual API call when backend is ready
  // return api.post<ResearchPlan>(`/planning/${sessionId}/generate`);

  // Mock implementation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        plan_id: `plan_${Date.now()}`,
        phases: [
          {
            phase_id: 'phase_1',
            name: 'Literature Review and Background Research',
            description: 'Comprehensive review of existing research on AI in science',
            order: 1,
            tasks: ['task_1', 'task_2', 'task_3'],
          },
          {
            phase_id: 'phase_2',
            name: 'Data Collection and Analysis',
            description: 'Gather and analyze data on AI adoption in research',
            order: 2,
            tasks: ['task_4', 'task_5'],
          },
        ],
        tasks: ['task_1', 'task_2', 'task_3', 'task_4', 'task_5'],
        estimated_credits: 150,
      });
    }, 1500);
  });
}
