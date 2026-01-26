/**
 * PlanReviewCard Component
 *
 * Displays the generated research plan summary with action buttons.
 * Allows user to confirm (create project) or revise (return to chat).
 */

import React from 'react';
import { Button } from '../common/Button';

export interface PlanSummaryData {
  research_goal: string;
  output_type: string;
  audience: string;
  phases: string[];
}

interface PlanReviewCardProps {
  planSummary: PlanSummaryData;
  onConfirm: () => void;
  onRevise: () => void;
  estimatedCredits?: number;
}

/**
 * PlanReviewCard component - displays plan summary with actions
 */
export const PlanReviewCard: React.FC<PlanReviewCardProps> = ({
  planSummary,
  onConfirm,
  onRevise,
  estimatedCredits,
}) => {
  // Format output type for display
  const formatOutputType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="max-w-3xl mx-auto my-6">
      <div
        className="
          border border-[var(--color-border)]
          rounded-lg
          bg-[var(--color-surface)]
          shadow-lg
          p-6
        "
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
            Your Research Plan
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Review your plan below. Confirm to start research or revise to make changes.
          </p>
        </div>

        {/* Plan Summary */}
        <div className="space-y-4 mb-6">
          {/* Research Goal */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Research Goal
            </label>
            <p className="mt-1 text-[var(--color-text-primary)]">
              {planSummary.research_goal}
            </p>
          </div>

          {/* Output Type */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Output Type
            </label>
            <div className="mt-1">
              <span
                className="
                  inline-block px-3 py-1 rounded-full text-sm font-medium
                  bg-[var(--color-primary)] bg-opacity-10
                  text-[var(--color-primary)]
                "
              >
                {formatOutputType(planSummary.output_type)}
              </span>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Target Audience
            </label>
            <p className="mt-1 text-[var(--color-text-primary)]">
              {planSummary.audience}
            </p>
          </div>

          {/* Phases */}
          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Research Phases
            </label>
            <ul className="mt-2 space-y-2">
              {planSummary.phases.map((phase, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 text-[var(--color-text-primary)]"
                >
                  <span
                    className="
                      flex-shrink-0 w-6 h-6 rounded-full
                      bg-[var(--color-primary)]
                      text-white text-sm font-medium
                      flex items-center justify-center
                    "
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{phase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Estimated Credits */}
          {estimatedCredits !== undefined && (
            <div>
              <label className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                Estimated Cost
              </label>
              <p className="mt-1 text-[var(--color-text-primary)]">
                {estimatedCredits} credits
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            className="flex-1"
          >
            Confirm & Start Research
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onRevise}
            className="flex-1"
          >
            Revise Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
