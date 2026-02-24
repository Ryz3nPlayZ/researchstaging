'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import {
    Bold,
    Italic,
    Strikethrough,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
    Code,
    Sparkles,
    Undo,
    Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TipTapContent } from '@/lib/types';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: TipTapContent | string;
    onChange: (json: TipTapContent) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder || 'Start writing...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0',
            }),
            Typography,
        ],
        content: typeof content === 'string' ? content : content, // Handle initial content
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON() as TipTapContent);
        },
    });

    // Update content if changed externally (e.g. initial load)
    useEffect(() => {
        if (editor && content && editor.isEmpty) {
            // Only set content if editor is empty to avoid overwriting user input
            // Ideally we'd compare content, but JSON comparison is expensive
            // For now, relies on initial load pattern
            // editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleStrike = () => editor.chain().focus().toggleStrike().run();
    const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
    const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
    const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
    const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
    const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
    const toggleCode = () => editor.chain().focus().toggleCodeBlock().run();
    const undo = () => editor.chain().focus().undo().run();
    const redo = () => editor.chain().focus().redo().run();

    return (
        <div className={cn("relative group", className)}>
            {/* Floating Toolbar (visible when focused or hovering container) */}
            <div className="sticky top-0 z-20 mb-4 flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-sm transition-opacity duration-200">
                <ToolbarButton onClick={toggleBold} isActive={editor.isActive('bold')} icon={Bold} label="Bold" />
                <ToolbarButton onClick={toggleItalic} isActive={editor.isActive('italic')} icon={Italic} label="Italic" />
                <ToolbarButton onClick={toggleStrike} isActive={editor.isActive('strike')} icon={Strikethrough} label="Strikethrough" />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <ToolbarButton onClick={toggleH1} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} label="Heading 1" />
                <ToolbarButton onClick={toggleH2} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} label="Heading 2" />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <ToolbarButton onClick={toggleBulletList} isActive={editor.isActive('bulletList')} icon={List} label="Bullet List" />
                <ToolbarButton onClick={toggleOrderedList} isActive={editor.isActive('orderedList')} icon={ListOrdered} label="Ordered List" />
                <ToolbarButton onClick={toggleBlockquote} isActive={editor.isActive('blockquote')} icon={Quote} label="Quote" />
                <ToolbarButton onClick={toggleCode} isActive={editor.isActive('codeBlock')} icon={Code} label="Code Block" />
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <ToolbarButton onClick={undo} isActive={false} icon={Undo} label="Undo" />
                <ToolbarButton onClick={redo} isActive={false} icon={Redo} label="Redo" />
                <div className="flex-1" />
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors">
                    <Sparkles size={14} />
                    <span>AI Assist</span>
                </button>
            </div>

            <BubbleMenu editor={editor} className="flex bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden">
                <button
                    onClick={toggleBold}
                    className={cn("p-2 hover:bg-gray-100 transition-colors", editor.isActive('bold') && 'bg-gray-100 text-blue-600')}
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={toggleItalic}
                    className={cn("p-2 hover:bg-gray-100 transition-colors", editor.isActive('italic') && 'bg-gray-100 text-blue-600')}
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={toggleStrike}
                    className={cn("p-2 hover:bg-gray-100 transition-colors", editor.isActive('strike') && 'bg-gray-100 text-blue-600')}
                >
                    <Strikethrough size={16} />
                </button>
            </BubbleMenu>

            <EditorContent editor={editor} className="min-h-[500px]" />
        </div>
    );
}

function ToolbarButton({
    onClick,
    isActive,
    icon: Icon,
    label
}: {
    onClick: () => void;
    isActive: boolean;
    icon: React.ElementType;
    label: string
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                "p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors",
                isActive && "bg-gray-100 text-blue-600 font-medium"
            )}
        >
            <Icon size={16} />
        </button>
    );
}
