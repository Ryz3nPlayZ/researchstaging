import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Reusable loading spinner component with consistent visual design.
 * Uses Material Symbols animation with CSS spin.
 *
 * Size variants:
 * - sm: h-8 w-8 (32px)
 * - md: h-12 w-12 (48px) - default
 * - lg: h-16 w-16 (64px)
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-3',
  };

  // Text size mapping to match spinner size
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Spinning circle */}
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-primary border-slate-200 dark:border-slate-700`}
        style={size === 'lg' ? { borderWidth: '3px' } : undefined}
      />

      {/* Optional text below spinner */}
      {text && (
        <p className={`text-slate-500 dark:text-slate-400 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
