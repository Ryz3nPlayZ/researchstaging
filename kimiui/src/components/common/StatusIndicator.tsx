import { cn } from '@/utils';

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-gray-500', label: 'Pending' },
  ready: { color: 'bg-blue-500', label: 'Ready' },
  running: { color: 'bg-yellow-500', label: 'Running' },
  executing: { color: 'bg-yellow-500', label: 'Executing' },
  completed: { color: 'bg-green-500', label: 'Completed' },
  failed: { color: 'bg-red-500', label: 'Failed' },
  waiting: { color: 'bg-orange-500', label: 'Waiting' },
  created: { color: 'bg-gray-500', label: 'Created' },
  planned: { color: 'bg-blue-500', label: 'Planned' },
};

export function StatusIndicator({ 
  status, 
  showLabel = true, 
  pulse = true,
  size = 'sm' 
}: StatusIndicatorProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('relative flex', sizeClasses[size])}>
        {pulse && ['running', 'executing'].includes(status.toLowerCase()) && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.color
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', sizeClasses[size], config.color)} />
      </span>
      {showLabel && (
        <span className="text-sm text-gray-300 capitalize">{config.label}</span>
      )}
    </div>
  );
}
