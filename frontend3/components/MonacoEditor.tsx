import React from 'react';

interface MonacoEditorProps {
  language: 'python' | 'r';
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language,
  value,
  onChange,
  height = '400px',
}) => {
  return (
    <div className="flex-1 h-full min-h-[400px] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full font-mono text-sm p-4 bg-slate-900 text-green-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
        placeholder={`Write your ${language.toUpperCase()} code here...`}
        spellCheck={false}
      />
    </div>
  );
};

export default MonacoEditor;
