import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PlainTextToolbarProps {
  contentRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
}

export default function PlainTextToolbar({ contentRef, onContentChange }: PlainTextToolbarProps) {
  const insertAtPosition = (text: string, moveCaretBy: number = 0) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent = 
      textarea.value.substring(0, start) + 
      text + 
      textarea.value.substring(end);

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length + moveCaretBy;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;
    
    // Находим начало текущей строки
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newContent = 
      value.substring(0, lineStart) + 
      prefix + 
      value.substring(lineStart);

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleHeading1 = () => insertLinePrefix('# ');
  const handleHeading2 = () => insertLinePrefix('## ');
  const handleHeading3 = () => insertLinePrefix('### ');
  const handleBold = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text
      const newContent = 
        textarea.value.substring(0, start) + 
        `**${selectedText}**` + 
        textarea.value.substring(end);
      
      onContentChange(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
      }, 0);
    } else {
      insertAtPosition('**text**', -2);
    }
  };
  
  const handleItalic = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text
      const newContent = 
        textarea.value.substring(0, start) + 
        `*${selectedText}*` + 
        textarea.value.substring(end);
      
      onContentChange(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
      }, 0);
    } else {
      insertAtPosition('*text*', -1);
    }
  };

  const handleList = () => insertLinePrefix('- ');
  const handleOrderedList = () => insertLinePrefix('1. ');
  const handleQuote = () => insertLinePrefix('> ');

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-t-lg">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading1}
          title="Heading 1"
          className="h-8 px-2 font-bold"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading2}
          title="Heading 2"
          className="h-8 px-2 font-bold"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading3}
          title="Heading 3"
          className="h-8 px-2 font-bold"
        >
          H3
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          title="Bold"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Italic"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleQuote}
          title="Quote"
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleList}
          title="Bullet List"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOrderedList}
          title="Numbered List"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
        Plain text formatting
      </div>
    </div>
  );
}
