import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { toast } from 'sonner';

interface MarkdownFileUploaderProps {
  onFileLoaded: (content: string, filename: string) => void;
}

export default function MarkdownFileUploader({ onFileLoaded }: MarkdownFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка расширения файла
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
      toast.error('Please select a Markdown file (.md or .markdown)');
      return;
    }

    // Проверка размера (max 1MB для текстового файла)
    if (file.size > 1024 * 1024) {
      toast.error('File is too large (max 1MB)');
      return;
    }

    try {
      const content = await file.text();
      
      // Извлекаем заголовок из первой строки если начинается с #
      const lines = content.split('\n');
      const firstLine = lines[0].trim();
      
      onFileLoaded(content, file.name);
      toast.success(`Loaded: ${file.name}`);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-black"
      >
        <FileUp className="h-4 w-4 mr-2" />
        Import Markdown File
      </Button>
    </>
  );
}
