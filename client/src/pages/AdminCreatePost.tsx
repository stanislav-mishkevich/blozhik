import { useState } from "react";
import { useLocation } from "wouter";
import AdminHeader from "@/components/AdminHeader";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { rustApi } from "@/lib/rustBack";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { X, Save, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCreatePost() {
  const { user } = useAuthState();
  const [location, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"plaintext" | "markdown">("markdown");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");

  const createMutation = rustApi.post.create.useMutation({
    onSuccess: (data) => {
      toast.success("Post created successfully!");
      setLocation(`/posts/${data.postId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

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

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    createMutation.mutate({
      title,
      content,
      contentType,
      tags,
      published: true,
      scheduledAt: null,
    });
  };

  const handleSaveDraft = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    createMutation.mutate({
      title,
      content,
      contentType,
      tags,
      published: false,
      scheduledAt: null,
    });
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin' && user?.role !== 'god') {
    return (
      <AdminHeader title="Access Denied">
        <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
          <AdminNav currentPath={location} />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins can create posts from admin panel.</p>
            </div>
          </main>
        </div>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader title="Create Post" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
          <h1 className="text-3xl font-bold mb-6">Create New Post</h1>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-2 border-black"
                maxLength={200}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Input
                id="excerpt"
                type="text"
                placeholder="Short description..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="border-2 border-black"
                maxLength={300}
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Tabs value={contentType} onValueChange={(v: any) => setContentType(v)}>
                <TabsList className="border-2 border-black">
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="plaintext">Plain Text</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder={
                  contentType === "markdown"
                    ? "Write your post in Markdown...\n\n# Heading\n**bold** *italic*\n- list item"
                    : "Write your post..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono border-2 border-black"
              />
              <p className="text-sm text-gray-500">{content.length} characters</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  type="text"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-2 border-black"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  className="border-2 border-black"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-2 border-black px-3 py-1"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:underline"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t-2 border-black dark:border-white">
              <Button
                onClick={handlePublish}
                disabled={createMutation.isPending}
                className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish Now
              </Button>
              <Button
                onClick={handleSaveDraft}
                disabled={createMutation.isPending}
                variant="outline"
                className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => setLocation("/admin")}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}
