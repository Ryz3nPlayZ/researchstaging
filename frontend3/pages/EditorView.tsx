
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { ChatMessage } from '../types';
import { chatApi } from '../lib/api';

// Agent type constants
const AGENT_TYPES = [
  { value: 'document', label: 'Document', icon: 'description', description: 'Analyze documents' },
  { value: 'literature', label: 'Literature', icon: 'menu_book', description: 'Search literature' },
  { value: 'memory', label: 'Memory', icon: 'psychology', description: 'Query memory' },
  { value: 'general', label: 'General', icon: 'chat', description: 'General assistance' },
] as const;

const EditorView: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: '<p>Start writing your document...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I've analyzed your document. You mentioned Smith et al. (2023) in the second paragraph. Would you like me to verify the DOI or fetch the full citation for your references list?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const response = await askResearchAssistant(inputText, "Current document: Neural Networks in Modern Research");
    
    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Editor Side */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center">
        {/* Floating Toolbar */}
        <div className="sticky top-4 mt-6 z-20 flex items-center gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('bold') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">format_bold</span>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('italic') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">format_italic</span>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('underline') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">format_underlined</span>
          </button>
          <button
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) {
                editor?.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('link') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">link</span>
          </button>
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">format_quote</span>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 ${
              editor?.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-600' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
          </button>
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI ASSIST
          </button>
        </div>

        {/* Document Content */}
        <article className="w-full max-w-[850px] min-h-[1100px] bg-white dark:bg-slate-950 my-8 shadow-xl rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
          <EditorContent editor={editor} />
        </article>
      </main>

      {/* AI Assistant Sidebar */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <span className="font-bold text-sm">Research AI</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {AGENT_TYPES.find(a => a.value === selectedAgent)?.description}
            </p>
          </div>
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Agent Selection */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          {AGENT_TYPES.map(agent => (
            <button
              key={agent.value}
              onClick={() => setSelectedAgent(agent.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedAgent === agent.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{agent.icon}</span>
              {agent.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl rounded-tl-none border border-slate-100 dark:border-slate-700 text-xs text-slate-400">
              Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/30">
          <div className="relative">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-primary focus:border-primary resize-none pr-10 py-3 leading-tight placeholder-slate-400" 
              placeholder="Ask about your research..." 
              rows={3} 
            />
            <button 
              onClick={handleSendMessage}
              disabled={isTyping}
              className="absolute right-2 bottom-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['Find sources', 'Fix grammar', 'Summarize'].map(action => (
              <button 
                key={action}
                onClick={() => setInputText(action)}
                className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default EditorView;
