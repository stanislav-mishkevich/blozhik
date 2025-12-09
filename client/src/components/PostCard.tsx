import { Heart, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: number;
    title: string;
    excerpt: string | null;
    createdAt: Date;
    published: boolean;
    readingTime?: number;
    scheduledAt?: string | null;
  };
  author: {
    id: number;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  tags: Array<{ id: number; name: string }>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  category?: { id: number; name: string; slug: string } | null;
}

export function PostCard({ post, author, tags, likeCount, commentCount, isLiked, isBookmarked, category }: PostCardProps) {
  const { isAuthenticated } = useAuthState();
  const utils = trpc.useUtils();
  
  const likeMutation = trpc.like.toggle.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: () => {
      toast.error("Failed to like post");
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to like posts");
      return;
    }
    likeMutation.mutate({ postId: post.id });
  };

  const bookmarkMutation = trpc.bookmark.toggle.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: () => {
      toast.error('Failed to toggle bookmark');
    }
  });

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to bookmark posts');
      return;
    }
    bookmarkMutation.mutate({ postId: post.id });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `/posts/${post.id}`;
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/users/${author.username}`;
  };

  const handleTagClick = (tagName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/feed?tag=${tagName}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div
      onClick={handleCardClick}
      className="block cursor-pointer bg-white dark:bg-gray-800 border-2 border-black rounded-lg p-6 sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all duration-200 hover:scale-[1.02] group"
    >
      {/* Author Info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-10 w-10 border-2 border-black">
          <AvatarImage src={author.avatarUrl || undefined} />
          <AvatarFallback className="bg-gray-200 text-black font-semibold">
            {getInitials(author.name, author.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <button
            onClick={handleAuthorClick}
            className="font-semibold hover:underline block truncate text-left"
          >
            {author.username || author.name || "Anonymous"}
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(post.createdAt)}</span>
            {post.readingTime && (
              <span className="ml-2">• {post.readingTime} min read</span>
            )}
          </div>
        </div>
        {!post.published && (
          <Badge variant="secondary" className="border border-black">
            Draft
          </Badge>
        )}
        {post.scheduledAt && !post.published && (
          <Badge variant="secondary" className="border border-black ml-2">
            Scheduled {new Date(post.scheduledAt).toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Post Content */}
      <h2 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">{post.title}</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>

      {/* Category */}
      {category && (
        <div className="mb-2">
          <Badge variant="outline" className="border-2 border-black">
            {category.name}
          </Badge>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <button
              key={tag.id}
              onClick={(e) => handleTagClick(tag.name, e)}
            >
              <Badge
                variant="outline"
                className="border-2 border-black hover:bg-yellow-100 transition-colors"
                style={{ backgroundColor: "var(--sketch-yellow)", color: "black" }}
              >
                #{tag.name}
              </Badge>
            </button>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="border-2 border-black">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`gap-2 ${isLiked ? "text-pink-600" : "text-gray-600"}`}
          disabled={likeMutation.isPending}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={`gap-2 text-gray-600`}
          disabled={bookmarkMutation.isPending}
          aria-label="Toggle bookmark"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M6 2h9a1 1 0 011 1v16l-5-3-5 3V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Button>
        <div className="flex items-center gap-2 text-gray-600">
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </div>
      </div>
    </div>
  );
}
