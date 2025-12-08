import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Link, 
  List, 
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface MarkdownToolbarProps {
  contentRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
}

export default function MarkdownToolbar({ contentRef, onContentChange }: MarkdownToolbarProps) {
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  const saveHistory = (content: string) => {
    historyRef.current.past.push(content);
    historyRef.current.future = [];
    // Ограничиваем историю 50 шагами
    if (historyRef.current.past.length > 50) {
      historyRef.current.past.shift();
    }
  };

  const undo = () => {
    const textarea = contentRef.current;
    if (!textarea || historyRef.current.past.length === 0) return;

    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push(textarea.value);
    onContentChange(previous);
    toast.info('Undo', { duration: 500 });
  };

  const redo = () => {
    const textarea = contentRef.current;
    if (!textarea || historyRef.current.future.length === 0) return;

    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(textarea.value);
    onContentChange(next);
    toast.info('Redo', { duration: 500 });
  };

  const wrapSelection = (before: string, after: string = before) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    saveHistory(textarea.value);

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = before + selectedText + after;

    const newContent = 
      textarea.value.substring(0, start) + 
      replacement + 
      textarea.value.substring(end);

    onContentChange(newContent);

    // Восстанавливаем фокус и выделение
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length);
      } else {
        const newPosition = start + before.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    saveHistory(textarea.value);

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent = 
      textarea.value.substring(0, start) + 
      text + 
      textarea.value.substring(end);

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    saveHistory(textarea.value);

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = textarea.value.split('\n');
    
    // Находим строки в выделении
    let currentPos = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 для \n
      if (currentPos <= start && start < currentPos + lineLength) {
        startLine = i;
      }
      if (currentPos <= end && end <= currentPos + lineLength) {
        endLine = i;
        break;
      }
      currentPos += lineLength;
    }

    // Добавляем префикс к каждой строке в диапазоне
    for (let i = startLine; i <= endLine; i++) {
      lines[i] = prefix + lines[i];
    }

    onContentChange(lines.join('\n'));

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const handleBold = () => wrapSelection('**');
  const handleItalic = () => wrapSelection('*');
  const handleStrikethrough = () => wrapSelection('~~');
  const handleCode = () => wrapSelection('`');
  const handleH1 = () => insertLinePrefix('# ');
  const handleH2 = () => insertLinePrefix('## ');
  const handleH3 = () => insertLinePrefix('### ');
  const handleQuote = () => insertLinePrefix('> ');
  const handleList = () => insertLinePrefix('- ');
  const handleOrderedList = () => insertLinePrefix('1. ');
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      wrapSelection('[', `](${url})`);
    }
  };

  // Обработка горячих клавиш
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (!modKey) return;

    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        handleBold();
        break;
      case 'i':
        e.preventDefault();
        handleItalic();
        break;
      case 'k':
        e.preventDefault();
        handleLink();
        break;
      case 'z':
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        break;
      case 'y':
        e.preventDefault();
        redo();
        break;
    }
  };

  // Подключаем обработчик горячих клавиш
  useEffect(() => {
    const textarea = contentRef.current;
    if (!textarea) return;

    textarea.addEventListener('keydown', handleKeyDown as any);
    return () => textarea.removeEventListener('keydown', handleKeyDown as any);
  }, [contentRef]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-t-lg">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          title="Undo (Ctrl+Z)"
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleH1}
          title="Heading 1"
          className="h-8 px-2 font-bold"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleH2}
          title="Heading 2"
          className="h-8 px-2 font-bold"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleH3}
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
          title="Bold (Ctrl+B)"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Italic (Ctrl+I)"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStrikethrough}
          title="Strikethrough"
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCode}
          title="Inline Code"
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          title="Insert Link (Ctrl+K)"
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
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
        Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link), Ctrl+Z (undo)
      </div>
    </div>
  );
}
