import { cn, getStatusColor, getStatusBgColor } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  status?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, status, className, size = 'sm' }: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  if (status) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium capitalize',
          sizeClasses[size],
          getStatusBgColor(status),
          getStatusColor(status),
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(status).replace('text-', 'bg-'))} />
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium text-gray-300 bg-kimidark-700 border border-kimidark-600',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
