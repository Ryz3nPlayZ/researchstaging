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
    <div className="flex-1 w-full h-full min-h-[400px] bg-[#1e1e1e] overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full font-mono text-sm p-4 bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none"
        style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', lineHeight: '1.5' }}
        placeholder={`Write your ${language.toUpperCase()} code here...`}
        spellCheck={false}
      />
    </div>
  );
};

export default MonacoEditor;
