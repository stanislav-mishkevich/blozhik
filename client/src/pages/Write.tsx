import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { X, Save, Send, Home, ChevronRight, PenSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/ImageUploader";
import PlainTextToolbar from "@/components/PlainTextToolbar";
import MarkdownFileUploader from "@/components/MarkdownFileUploader";

// Simple markdown renderer for preview
function renderMarkdown(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  let inOrderedList = false;
  
  // Helper to process inline formatting (bold, italic)
  const processInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Escape HTML first
    line = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Headers
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      const headerText = processInline(line.substring(4));
      result.push(`<h3>${headerText}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      const headerText = processInline(line.substring(3));
      result.push(`<h2>${headerText}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      const headerText = processInline(line.substring(2));
      result.push(`<h1>${headerText}</h1>`);
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      const quoteText = processInline(line.substring(2));
      result.push(`<blockquote>${quoteText}</blockquote>`);
      continue;
    }
    
    // Unordered list
    if (line.startsWith('- ')) {
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      if (!inList) { result.push('<ul>'); inList = true; }
      const listText = processInline(line.substring(2));
      result.push(`<li>${listText}</li>`);
      continue;
    }
    
    // Ordered list
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (!inOrderedList) { result.push('<ol>'); inOrderedList = true; }
      const listText = processInline(orderedMatch[1]);
      result.push(`<li>${listText}</li>`);
      continue;
    }
    
    // Close lists if not list item
    if (inList) { result.push('</ul>'); inList = false; }
    if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
    
    // Empty line = paragraph break
    if (line.trim() === '') {
      result.push('<br>');
    } else {
      // Regular paragraph with inline formatting
      const processedLine = processInline(line);
      result.push(`<p>${processedLine}</p>`);
    }
  }
  
  // Close any open lists
  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');
  
  return result.join('\n');
}

export default function Write() {
  const { isAuthenticated, loading } = useAuthState();
  const [, setLocation] = useLocation();
  const params = useParams();
  const postId = params.id ? parseInt(params.id) : undefined;
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"plaintext" | "markdown">("markdown");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: existingPost } = trpc.post.getById.useQuery(
    { postId: postId! },
    { enabled: !!postId }
  );

  const { data: drafts } = trpc.post.getDrafts.useQuery(undefined, { enabled: isAuthenticated });

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [draftId, setDraftId] = useState<number | undefined>(postId);
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  const saveDraftMutation = trpc.post.saveDraft.useMutation({
    onSuccess: (res) => {
      if (res.postId) setDraftId(res.postId);
      setLastSavedAt(new Date());
      setIsDirty(false);
      toast.success('Draft saved', { duration: 1000 });
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.post.title);
      setContent(existingPost.post.content);
      setContentType(existingPost.post.contentType as "plaintext" | "markdown");
      setTags(existingPost.tags.map((t) => t.name));
      setCategoryId(existingPost.post.categoryId ?? null);
      setScheduledAt(existingPost.post.scheduledAt ?? null);
    }
    else if (!postId && drafts && drafts.length > 0 && !draftLoaded) {
      const latest = drafts[0];
      if (latest.title || latest.content) {
        setTitle(latest.title || '');
        setContent(latest.content || '');
        setContentType((latest as any).contentType || 'markdown');
        setTags([]);
        setDraftId((latest as any).id);
        setDraftLoaded(true);
        toast.info('Draft loaded from your last session', {
          description: 'Click "Clear Form" if you want to start fresh',
          duration: 5000,
        });
      }
    }
  }, [existingPost, drafts, postId, draftLoaded]);

  useEffect(() => {
    setIsDirty(true);
  }, [title, content, contentType, tags, categoryId]);

  const createMutation = trpc.post.create.useMutation({
    onSuccess: (data) => {
      toast.success("Post created successfully!");
      setLocation(`/posts/${data.postId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  const updateMutation = trpc.post.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully!");
      setLocation(`/posts/${postId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update post");
    },
  });

  const handleImageUploaded = (url: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageMarkdown = `![Image](${url})`;
    
    const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + imageMarkdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleFileLoaded = (fileContent: string, filename: string) => {
    // Пытаемся извлечь заголовок из первой строки
    const lines = fileContent.split('\n');
    let extractedTitle = '';
    let contentWithoutTitle = fileContent;

    if (lines[0].startsWith('# ')) {
      extractedTitle = lines[0].replace('# ', '').trim();
      contentWithoutTitle = lines.slice(1).join('\n').trim();
    }

    if (extractedTitle && !title) {
      setTitle(extractedTitle);
    }
    
    setContent(contentWithoutTitle);
    setContentType('markdown');
    toast.info(`Loaded ${filename}. You can now edit and publish.`);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate({ 
      postId: draftId, 
      title: title || '', 
      content: content || '', 
      contentType, 
      tags,
      categoryId: categoryId ?? null
    });
  };

  const handleClearForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setCategoryId(null);
    setScheduledAt(null);
    setDraftId(undefined);
    setIsDirty(false);
    toast.success('Form cleared');
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (postId) {
      updateMutation.mutate({
        postId,
        title,
        content,
        contentType,
        tags,
        categoryId: categoryId ?? null,
        published: true,
        scheduledAt: null,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        contentType,
        tags,
        categoryId: categoryId ?? null,
        published: true,
        scheduledAt: null,
      });
    }
  };

  // Autosave every 10 seconds when dirty
  useEffect(() => {
    const iv = setInterval(() => {
      if (!isAuthenticated) return;
      if (!isDirty) return;
      saveDraftMutation.mutate({ 
        postId: draftId, 
        title: title || '', 
        content: content || '', 
        contentType, 
        tags,
        categoryId: categoryId ?? null
      });
    }, 10000);
    return () => clearInterval(iv);
  }, [isDirty, draftId, title, content, contentType, tags, categoryId, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <button onClick={() => setLocation('/')} className="hover:text-gray-900 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => setLocation('/feed')} className="hover:text-gray-900">
            Feed
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium flex items-center gap-1">
            <PenSquare className="h-4 w-4" />
            {postId ? "Edit Post" : "Write Post"}
          </span>
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
          <h1 className="text-3xl font-bold mb-6">
            {postId ? "Edit Post" : "Write a New Post"}
          </h1>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter your post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="border-2 border-black text-xl font-semibold"
              />
              <p className="text-sm text-gray-500">{title.length}/200 characters</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={categoryId?.toString() || '__none__'} 
                onValueChange={(value) => {
                  if (value === '__none__') {
                    setCategoryId(null);
                  } else {
                    const parsed = parseInt(value, 10);
                    setCategoryId(isNaN(parsed) ? null : parsed);
                  }
                }}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Format</Label>
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
                <TabsList className="border-2 border-black">
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="plaintext">Plain Text</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Import & Image Upload for Markdown */}
            {contentType === 'markdown' && (
              <div className="flex gap-3">
                <MarkdownFileUploader onFileLoaded={handleFileLoaded} />
                <ImageUploader onImageUploaded={handleImageUploaded} maxSizeMB={5} />
              </div>
            )}

            {/* Plain Text Toolbar */}
            {contentType === 'plaintext' && (
              <PlainTextToolbar 
                contentRef={contentRef} 
                onContentChange={setContent} 
              />
            )}

            {/* Content with Preview for Plain Text */}
            {contentType === 'plaintext' ? (
              <div className="space-y-2">
                <Label>Content</Label>
                <Tabs defaultValue="write" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="write" className="mt-0">
                    <Textarea
                      ref={contentRef}
                      id="content"
                      placeholder="Write your post... Use toolbar above for formatting."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="border-2 border-t-0 rounded-t-none min-h-[400px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-0">
                    <div 
                      className="border-2 border-t-0 rounded-t-none min-h-[400px] p-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    />
                  </TabsContent>
                </Tabs>
                <p className="text-sm text-gray-500">
                  Plain text with formatting buttons - switch to Preview to see formatted result
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  ref={contentRef}
                  id="content"
                  placeholder="Write your post in Markdown...\n\n## Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="border-2 min-h-[400px] font-mono border-black rounded-lg"
                />
                <p className="text-sm text-gray-500">
                  Markdown mode - import .md files or paste markdown directly
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (up to 10)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-2 border-black"
                  disabled={tags.length >= 10}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  className="border-2 border-black"
                  disabled={tags.length >= 10}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-2 border-black pl-3 pr-1 py-1"
                      style={{ backgroundColor: "var(--sketch-yellow)" }}
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Publish */}
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule Publish (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt ? new Date(scheduledAt).toISOString().slice(0,16) : ''}
                onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="border-2 border-black"
              />
            </div>

            {/* Draft status */}
            {lastSavedAt && (
              <div className="text-sm text-gray-600">
                Draft saved at {lastSavedAt.toLocaleTimeString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200">
              <Button
                onClick={handleClearForm}
                variant="outline"
                className="border-2 border-gray-300 sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                disabled={createMutation.isPending || updateMutation.isPending || saveDraftMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Form
              </Button>
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                className="flex-1 border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                disabled={createMutation.isPending || updateMutation.isPending || saveDraftMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={handlePublish}
                className="flex-1 border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {postId ? "Update Post" : "Publish Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
