'use client';

import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Heading,
  Heading1,
  Heading2,
  Heading3, 
  Type,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  ImageIcon,
  Link,
  Unlink,
  Table,
  ChevronDown
} from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MenuBarProps {
  editor: Editor | null;
  onImageUpload: () => void;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

// Simple Dropdown Menu Component
function DropdownMenu({ trigger, children, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === 'left' ? rect.left : rect.right - 140
      });
    }
  }, [isOpen, align]);

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function DropdownMenuItem({ onClick, children, className }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2",
        className
      )}
    >
      {children}
    </button>
  );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'icon';
  children: React.ReactNode;
}

function Button({ variant = 'ghost', size = 'icon', className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
        variant === 'default' && "bg-primary-600 text-white hover:bg-primary-700",
        variant === 'ghost' && "hover:bg-gray-100",
        size === 'icon' && "h-8 w-8",
        size === 'sm' && "h-8 px-2 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default function MenuBar({ editor, onImageUpload }: MenuBarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const linkButtonRef = useRef<HTMLDivElement>(null);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setShowLinkInput(false);
      setLinkUrl('');
    }
  }, [linkUrl, editor]);

  const toggleLinkInput = useCallback(() => {
    if (!showLinkInput && linkButtonRef.current) {
      const rect = linkButtonRef.current.getBoundingClientRect();
      setLinkPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
    setShowLinkInput(!showLinkInput);
    if (showLinkInput) {
      setLinkUrl('');
    }
  }, [showLinkInput]);

  if (!editor) {
    return null;
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="sticky top-0 border-b bg-white shadow-sm z-20 rounded-t-lg border-gray-200">
      {/* Compact toolbar - responsive layout */}
      <div className="flex flex-wrap lg:flex-nowrap overflow-x-hidden gap-0.5 p-1.5 items-center">
        {/* Text Formatting */}
        <div className="flex gap-0.5 shrink-0 items-center">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden lg:block" />

        {/* Headings Dropdown */}
        <div className="shrink-0">
          <DropdownMenu
            trigger={
              <Button
                variant={editor.isActive('heading') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 gap-0.5"
                title="Heading level"
              >
                <Heading className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            }
            align="left"
          >
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-100' : ''}
            >
              <Heading1 className="h-4 w-4" /> শিরোনাম ১
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : ''}
            >
              <Heading2 className="h-4 w-4" /> শিরোনাম ২
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-100' : ''}
            >
              <Heading3 className="h-4 w-4" /> শিরোনাম ৩
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={!editor.isActive('heading') ? 'bg-gray-100' : ''}
            >
              <Type className="h-4 w-4" /> অনুচ্ছেদ
            </DropdownMenuItem>
          </DropdownMenu>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden lg:block" />

        {/* Lists Dropdown */}
        <div className="shrink-0">
          <DropdownMenu
            trigger={
              <Button
                variant={editor.isActive('bulletList') || editor.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 gap-0.5"
                title="List style"
              >
                <List className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            }
            align="left"
          >
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-gray-100' : ''}
            >
              <List className="h-4 w-4" /> বুলেট তালিকা
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-gray-100' : ''}
            >
              <ListOrdered className="h-4 w-4" /> নম্বর তালিকা
            </DropdownMenuItem>
          </DropdownMenu>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden lg:block" />

        {/* Alignment Dropdown */}
        <div className="shrink-0">
          <DropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-0.5"
                title="Text alignment"
              >
                <AlignLeft className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            }
            align="left"
          >
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100' : ''}
            >
              <AlignLeft className="h-4 w-4" /> বাম প্রান্তিক
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100' : ''}
            >
              <AlignCenter className="h-4 w-4" /> মাঝখানে
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100' : ''}
            >
              <AlignRight className="h-4 w-4" /> ডান প্রান্তিক
            </DropdownMenuItem>
          </DropdownMenu>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden lg:block" />

        {/* Insert Elements */}
        <div className="flex gap-0.5 shrink-0 items-center">
          <Button
            onClick={onImageUpload}
            variant="ghost"
            title="ছবি যোগ করুন"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            title="উদ্ধৃতি"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            variant="ghost"
            title="অনুভূমিক রেখা"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={insertTable}
            variant={editor.isActive('table') ? 'default' : 'ghost'}
            title="টেবিল যোগ করুন"
          >
            <Table className="h-3.5 w-3.5" />
          </Button>

          {/* Link Controls */}
          <div className="relative" ref={linkButtonRef}>
            {showLinkInput ? (
              <div 
                className="fixed flex gap-0.5 bg-white border border-gray-200 rounded-md p-2 shadow-lg z-50 whitespace-nowrap"
                style={{ top: `${linkPosition.top}px`, left: `${linkPosition.left}px` }}
              >
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL লিখুন"
                  className="px-2 py-1 border border-gray-300 rounded text-sm w-40 sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLink();
                    } else if (e.key === 'Escape') {
                      setShowLinkInput(false);
                      setLinkUrl('');
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={addLink}
                  size="sm"
                  variant="default"
                >
                  যোগ
                </Button>
                <Button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                  size="sm"
                  variant="ghost"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    toggleLinkInput();
                  }
                }}
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                title={editor.isActive('link') ? 'লিংক সরান' : 'লিংক যোগ করুন'}
              >
                {editor.isActive('link') ? (
                  <Unlink className="h-3.5 w-3.5" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden lg:block" />

        {/* Undo/Redo */}
        <div className="flex gap-0.5 shrink-0 items-center">
          <Button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            variant="ghost"
            title="পূর্বাবস্থা (Ctrl+Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            variant="ghost"
            title="পুনরায় করুন (Ctrl+Y)"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
