import { useRef, useEffect } from 'react';
import { cn, formatDateTime } from '@/utils';
import type { ExecutionLog } from '@/types';

interface LogViewerProps {
  logs: ExecutionLog[];
  maxHeight?: string;
  autoScroll?: boolean;
}

const levelColors: Record<string, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  critical: 'text-red-500 font-bold',
};

export function LogViewer({ logs, maxHeight = '400px', autoScroll = true }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No logs yet</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="font-mono text-xs overflow-auto rounded-lg bg-kimidark-900 border border-kimidark-600 p-4"
      style={{ maxHeight }}
    >
      <div className="space-y-1">
        {logs.map((log, index) => (
          <div key={log.id || index} className="flex gap-3 hover:bg-kimidark-800/50 rounded px-1 -mx-1">
            <span className="text-gray-600 flex-shrink-0">
              {formatDateTime(log.timestamp).split(',')[1]?.trim() || formatDateTime(log.timestamp)}
            </span>
            <span className={cn('uppercase flex-shrink-0 w-16', levelColors[log.level] || 'text-gray-400')}>
              {log.level}
            </span>
            <span className="text-gray-400 flex-shrink-0 w-24">
              {log.event_type}
            </span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
