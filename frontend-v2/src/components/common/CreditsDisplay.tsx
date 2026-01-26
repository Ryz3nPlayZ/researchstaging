/**
 * CreditsDisplay Component
 *
 * Displays user's credit balance with prominent "remaining" count
 * and optional "used" information. Integrates with useCreditStore.
 */

import React from 'react';
import { useCreditStore } from '../../stores/useCreditStore';

interface CreditsDisplayProps {
  /** Whether to show the "used" credits count */
  showUsed?: boolean;
  /** Alignment of the credits display */
  align?: 'left' | 'center' | 'right';
}

/**
 * CreditsDisplay component - shows credit balance
 */
export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  showUsed = false,
  align = 'left',
}) => {
  const { creditsRemaining, creditsUsed } = useCreditStore();

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  // Format number with commas (e.g., 1,000)
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className={`${alignmentClass}`}>
      {/* Main credits remaining display */}
      <div
        className="text-4xl font-bold"
        style={{
          color: 'var(--color-primary)',
          fontFamily: 'var(--font-family)',
          fontWeight: 'var(--font-weight-bold)',
          lineHeight: 'var(--line-height-tight)',
        }}
      >
        {formatNumber(creditsRemaining)}
      </div>

      {/* Label text */}
      <div
        className="text-sm"
        style={{
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-small)',
          marginTop: 'var(--spacing-xs)',
        }}
      >
        credits remaining
      </div>

      {/* Optional: Show used credits */}
      {showUsed && (
        <div
          className="text-xs mt-2"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-x-small)',
            marginTop: 'var(--spacing-sm)',
          }}
        >
          Used: {formatNumber(creditsUsed)}
        </div>
      )}
    </div>
  );
};
