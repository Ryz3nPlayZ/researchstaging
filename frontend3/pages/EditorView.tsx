
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { ChatMessage } from '../types';
import { chatApi, exportApi, documentApi, projectApi, citationApi } from '../lib/api';
import type { Project } from '../lib/api';

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
  const [exporting, setExporting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Document state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Citation search state
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationQuery, setCitationQuery] = useState('');
  const [citationResults, setCitationResults] = useState<any[]>([]);
  const [searchingCitations, setSearchingCitations] = useState(false);

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (exporting) return;

    setExporting(true);

    try {
      if (format === 'pdf') {
        await exportApi.pdf(documentId, projectId);
      } else {
        await exportApi.docx(documentId, projectId);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load first project on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await projectApi.list();
        if (response.data && response.data.length > 0) {
          setCurrentProject(response.data[0]);
          setCurrentProjectId(response.data[0].id);
        }
      } catch (err) {
        console.error('Load project error:', err);
      }
    };

    loadProject();
  }, []);

  // Load existing document on mount
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const docId = pathParts[pathParts.length - 1];

    if (docId && docId !== 'editor') {
      loadDocument(docId);
    }
  }, []);

  // Auto-save with 4-second debounce
  useEffect(() => {
    if (!editor || !documentId) return;

    const saveTimeout = setTimeout(async () => {
      setSavingStatus('saving');

      try {
        const content = editor.getJSON();
        await documentApi.update(documentId, content, documentTitle);
        setSavingStatus('saved');
      } catch (err) {
        console.error('Save error:', err);
        setSavingStatus('unsaved');
      }
    }, 4000); // 4-second debounce

    return () => clearTimeout(saveTimeout);
  }, [editor?.getJSON(), documentId, documentTitle]);

  // Load document function
  const loadDocument = async (id: string) => {
    try {
      const response = await documentApi.get(id);
      if (response.error) throw new Error(response.error);

      setDocumentId(response.data.id);
      setDocumentTitle(response.data.title);
      setSavingStatus('saved');

      if (editor && response.data.content) {
        editor.commands.setContent(response.data.content);
      }
    } catch (err) {
      console.error('Load document error:', err);
      alert('Failed to load document');
    }
  };

  // Create new document function
  const handleNewDocument = async () => {
    if (!currentProjectId) {
      alert('Please create a project first');
      return;
    }

    try {
      const response = await documentApi.create(currentProjectId);
      if (response.error) throw new Error(response.error);

      setDocumentId(response.data.id);
      setDocumentTitle(response.data.title);
      setSavingStatus('saved');

      // Load TipTap content if exists
      if (response.data.content && editor) {
        editor.commands.setContent(response.data.content);
      } else if (editor) {
        // Clear editor for new document
        editor.commands.setContent('<p></p>');
      }

      // Update URL
      window.history.pushState({}, '', `/editor/${response.data.id}`);
    } catch (err) {
      console.error('Create document error:', err);
      alert('Failed to create document');
    }
  };

  // Citation search handler
  const handleCitationSearch = async () => {
    if (citationQuery.length < 2) return;

    setSearchingCitations(true);

    try {
      const response = await citationApi.search(citationQuery, 10);
      if (response.error) throw new Error(response.error);

      setCitationResults(response.data || []);
    } catch (err) {
      console.error('Citation search error:', err);
      alert('Failed to search citations');
    } finally {
      setSearchingCitations(false);
    }
  };

  // Insert citation handler
  const insertCitation = (paper: any) => {
    if (!editor) return;

    // Insert citation placeholder at cursor
    const citationText = `[@${paper.id || paper.external_id}]`;
    editor.commands.insertContent(citationText);

    setShowCitationModal(false);
    setCitationQuery('');
    setCitationResults([]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
      agent_type: selectedAgent,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Get current document context from TipTap editor if available
      const documentContext = editor?.getHTML() || undefined;

      // Call backend chat API instead of direct Gemini
      const response = await chatApi.send(inputText, selectedAgent, documentContext);

      if (response.error || !response.data) {
        throw new Error(response.error || 'No response from server');
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || 'No response from agent',
        timestamp: new Date(),
        agent_type: response.data.agent_type || selectedAgent,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Export</span>
              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
            </button>

            {/* Dropdown menu */}
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden min-w-[150px] z-50">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as DOCX
              </button>
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={handleNewDocument}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Document
          </button>
          <button
            onClick={() => setShowCitationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">format_quote</span>
            Insert Citation
          </button>
          <div className="text-sm text-slate-600 dark:text-slate-400 ml-2">
            {savingStatus === 'saved' && '✓ Saved'}
            {savingStatus === 'saving' && 'Saving...'}
            {savingStatus === 'unsaved' && '● Unsaved changes'}
          </div>
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
              {msg.role === 'assistant' && msg.agent_type && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  {AGENT_TYPES.find(a => a.value === msg.agent_type)?.label || 'AI'} Agent
                </div>
              )}
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

      {/* Citation Search Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col m-4">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Insert Citation</h2>
              <button
                onClick={() => {
                  setShowCitationModal(false);
                  setCitationQuery('');
                  setCitationResults([]);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={citationQuery}
                  onChange={(e) => setCitationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCitationSearch()}
                  placeholder="Search for papers by title, author, or keywords..."
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  onClick={handleCitationSearch}
                  disabled={searchingCitations || citationQuery.length < 2}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchingCitations ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {citationResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  {citationQuery.length < 2
                    ? 'Enter at least 2 characters to search'
                    : 'No results found. Try a different search query.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {citationResults.map((paper, index) => (
                    <div
                      key={index}
                      onClick={() => insertCitation(paper)}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
                        {paper.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2">
                        <span>{paper.year}</span>
                        {paper.journal && <span>• {paper.journal}</span>}
                        {paper.source && (
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] uppercase">
                            {paper.source}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorView;
