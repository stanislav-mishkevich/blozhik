import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { SEO } from "@/components/SEO";
import { ShareButtons } from "@/components/ShareButtons";
import CommentItem from "@/components/CommentItem";
import { rustApi } from "@/lib/rustBack";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { Heart, MessageCircle, Calendar, Edit, Trash2, Send, Flag, Home, ChevronLeft, ChevronRight, Sparkles, Bookmark } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PostView() {
  const params = useParams();
  const postId = parseInt(params.id || "0");
  const { user, isAuthenticated } = useAuthState();
  const [, setLocation] = useLocation();
  const [commentContent, setCommentContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { data, isLoading } = rustApi.post.getById.useQuery({ postId });
    const { data: comments } = rustApi.comment.getByPostId.useQuery({ postId });
    const { data: similarPosts } = rustApi.post.getSimilar.useQuery({ postId, limit: 4 }, { enabled: !!postId });
    const utils = rustApi.useUtils();

  const likeMutation = rustApi.like.toggle.useMutation({
    onSuccess: () => {
      utils.post.getById.invalidate({ postId });
    },
  });

  const postReactMutation = rustApi.post.react.useMutation({
    onSuccess: () => {
      utils.post.getById.invalidate({ postId });
    },
  });

  const bookmarkMutation = rustApi.bookmark.toggle.useMutation({
    onSuccess: () => {
      utils.post.getById.invalidate({ postId });
      toast.success(data?.isBookmarked ? "Bookmark removed" : "Post bookmarked!");
    },
  });

  const commentMutation = rustApi.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      utils.comment.getByPostId.invalidate({ postId });
      toast.success("Comment added!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const deleteCommentMutation = rustApi.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.getByPostId.invalidate({ postId });
      toast.success("Comment deleted");
    },
  });

  const deletePostMutation = rustApi.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      setLocation("/feed");
    },
  });

  const reportPostMutation = rustApi.report.create.useMutation({
    onSuccess: () => {
      toast.success("Report submitted. Thank you for helping keep our community safe!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const handleComment = () => {
    if (!commentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    commentMutation.mutate({ postId, content: commentContent });
  };

  const handleDeletePost = () => {
    deletePostMutation.mutate({ postId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">Post not found</div>
        </div>
      </div>
    );
  }

  const { post, author, tags, likeCount, isLiked } = data;
  const isAuthor = user?.id === author?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${post.title} - Blozhik`}
        description={post.excerpt || post.content.substring(0, 160)}
        keywords={tags.map(t => t.name)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        type="article"
        author={author?.username || author?.name || 'Anonymous'}
        publishedTime={new Date(post.createdAt).toISOString()}
      />
      <Header />

      <article className="container mx-auto px-4 py-8 max-w-4xl">
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
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</span>
        </div>

        {/* Post Header */}
        <div className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow mb-6">
          {/* Author Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-black">
              <AvatarImage src={author?.avatarUrl || undefined} />
              <AvatarFallback className="bg-gray-200 text-black font-semibold">
                {getInitials(author?.name || null, author?.username || null)}
              </AvatarFallback>
            </Avatar>
              <div>
                <button
                  onClick={() => setLocation(`/users/${author?.username}`)}
                  className="font-semibold hover:underline block"
                >
                  {author?.username || author?.name || "Anonymous"}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {isAuthor && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/posts/${postId}/edit`)}
                  className="border-2 border-black"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="border-2 border-black text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setLocation(`/feed?tag=${tag.name}`)}
                >
                  <Badge
                    variant="outline"
                    className="border-2 border-black hover:bg-yellow-100 transition-colors"
                    style={{ backgroundColor: "var(--sketch-yellow)" }}
                  >
                    #{tag.name}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="mt-6 mb-8">
            <div className="max-w-none">
              {post.contentType === "markdown" ? (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: post.renderedContent }}
                />
              ) : (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: post.renderedContent || post.content }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Actions & Reactions */}
        <div className="bg-white border-2 border-black rounded-lg p-4 sketch-shadow mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Reactions - minimalist style */}
            <div className="flex items-center gap-2">
              {[
                { key: 'heart', label: '❤️', name: 'Heart' },
                { key: 'laugh', label: '😂', name: 'Laugh' },
                { key: 'ok', label: '👌', name: 'OK' },
                { key: 'thumbs_down', label: '👎', name: 'Thumbs Down' }
              ].map((reaction) => {
                const reactionCount = data?.reactionCounts?.[reaction.key] || 0;
                return (
                  <button
                    key={reaction.key}
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please login to react');
                        return;
                      }
                      postReactMutation.mutate({ postId, reactionType: reaction.key as any });
                    }}
                    disabled={postReactMutation.isPending}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all ${
                      data?.userReaction === reaction.key 
                        ? 'bg-yellow-100' 
                        : 'bg-transparent'
                    }`}
                    title={reaction.name}
                  >
                    <span className="text-lg">{reaction.label}</span>
                    {reactionCount > 0 && (
                      <span className="text-sm font-bold text-gray-700">{reactionCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Comments Count */}
            <button 
              onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{comments?.length || 0}</span>
            </button>

            {/* Bookmark */}
            {isAuthenticated && (
              <button
                onClick={() => bookmarkMutation.mutate({ postId })}
                disabled={bookmarkMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all ${
                  data?.isBookmarked ? 'bg-yellow-100' : ''
                }`}
                title={data?.isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
              >
                <Bookmark className={`h-5 w-5 ${
                  data?.isBookmarked ? 'fill-current' : ''
                }`} />
              </button>
            )}

            {/* Share */}
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={post.title}
              description={post.excerpt || post.content.substring(0, 160)}
            />

            {/* Report */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const reason = prompt('Reason for report:\n1. Spam\n2. Offensive\n3. Harassment\n4. Adult content\n5. Other');
                  const reasonMap: Record<string, string> = {
                    '1': 'spam',
                    '2': 'offensive',
                    '3': 'harassment',
                    '4': 'adult',
                    '5': 'other'
                  };
                  if (reason && reasonMap[reason]) {
                    const description = prompt('Additional details (optional):');
                    reportPostMutation.mutate({
                      targetType: 'post',
                      targetId: post.id,
                      reason: reasonMap[reason] as 'spam' | 'offensive' | 'harassment' | 'adult' | 'other',
                      description: description || undefined
                    });
                  }
                }}
                className="rounded-lg hover:bg-gray-100 transition-all"
                title="Report"
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div id="comments-section" className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 sketch-shadow mb-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Comments ({comments?.filter(c => !c.comment.parentId).length || 0})
              </h2>

            {/* Add Comment */}
            {isAuthenticated ? (
              <div className="mb-6 sm:mb-8">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="border-2 border-black rounded-lg mb-3 bg-white"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">{commentContent.length}/1000 characters</p>
                  <Button
                    onClick={handleComment}
                    disabled={commentMutation.isPending || !commentContent.trim()}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all bg-blue-500 text-white font-bold"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-8 text-center py-6 border-2 border-black bg-white">
                <p className="font-bold">
                  Please{" "}
                  <button
                    onClick={() => setLocation("/login")}
                    className="underline hover:no-underline text-blue-600"
                  >
                    login
                  </button>{" "}
                  to comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments && comments.length > 0 ? (
                comments
                  .filter(c => !c.comment.parentId)
                  .map((item) => (
                    <CommentItem
                      key={item.comment.id}
                      comment={item.comment}
                      author={item.author}
                      postId={postId}
                      postOwnerId={post.userId}
                      reactionCounts={
                        item.reactionCounts ? (typeof item.reactionCounts === 'string' ? JSON.parse(item.reactionCounts) : item.reactionCounts) : {}
                      }
                      replyCount={item.replyCount}
                      onDeleted={() => utils.comment.getByPostId.invalidate({ postId })}
                    />
                  ))
              ) : (
                <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 font-bold">No comments yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>

          {/* Similar Posts */}
          {similarPosts && similarPosts.length > 0 && (
            <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 sketch-shadow mb-8">
              <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Similar Posts
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {similarPosts.map((item) => (
                  <button
                    key={item.post.id}
                    onClick={() => setLocation(`/posts/${item.post.id}`)}
                    className="text-left border-2 border-black rounded-lg p-3 sm:p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                  >
                    <h3 className="font-black text-lg mb-2">{item.post.title}</h3>
                    {item.post.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                      <span>{item.author.username || item.author.name}</span>
                      <span>•</span>
                      <span>{item.readingTime} min</span>
                      <span>•</span>
                      <span>{item.likeCount} ❤️</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
      </article>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="border-2 border-black"
              style={{ backgroundColor: "var(--sketch-pink)", color: "white" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
