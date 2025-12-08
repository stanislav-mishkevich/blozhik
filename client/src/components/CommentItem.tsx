import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthState } from "@/hooks/useAuthState";
import { useLocation } from "wouter";
import { Trash2, MessageCircle, Smile } from "lucide-react";
import { toast } from "sonner";

interface CommentItemProps {
  comment: any;
  author: any;
  postId: number;
  postOwnerId?: number;
  reactionCounts?: Record<string, number>;
  replyCount?: number;
  onDeleted?: () => void;
}

export default function CommentItem({ 
  comment, 
  author, 
  postId, 
  postOwnerId,
  reactionCounts = {},
  replyCount = 0,
  onDeleted 
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuthState();
  const [, setLocation] = useLocation();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const utils = trpc.useUtils();

  const { data: reactionData } = trpc.comment.getReaction.useQuery(
    { commentId: comment.id, userId: user?.id },
    { enabled: !!user }
  );

  const { data: replies } = trpc.comment.getReplies.useQuery(
    { parentId: comment.id },
    { enabled: showReplies }
  );

  const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      onDeleted?.();
      utils.comment.getByPostId.invalidate({ postId });
      utils.comment.getReplies.invalidate({ parentId: comment.parentId });
    },
  });

  const replyMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setReplyContent("");
      setShowReplyForm(false);
      toast.success("Reply posted");
      utils.comment.getReplies.invalidate({ parentId: comment.id });
      utils.comment.getByPostId.invalidate({ postId });
    },
  });

  const reactMutation = trpc.comment.react.useMutation({
    onSuccess: () => {
      utils.comment.getByPostId.invalidate({ postId });
      utils.comment.getReplies.invalidate({ parentId: comment.parentId });
      utils.comment.getReaction.invalidate({ commentId: comment.id });
    },
  });

  const formatDate = (date: Date | string) => {
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

  const EMOJIS: { key: string; label: string }[] = [
    { key: 'heart', label: '❤️' },
    { key: 'laugh', label: '😂' },
    { key: 'ok', label: '👌' },
    { key: 'thumbs_down', label: '👎' },
  ];
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (type: 'heart' | 'laugh' | 'ok' | 'thumbs_down') => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }
    reactMutation.mutate({ commentId: comment.id, reactionType: type });
  };

  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    replyMutation.mutate({ 
      postId, 
      content: replyContent, 
      parentId: comment.id 
    });
  };

  const userReaction = reactionData?.reaction;
  const parsedReactionCounts: Record<string, number> = (() => {
    if (!reactionCounts) return {};
    // sometimes the server returns a JSON string
    if (typeof reactionCounts === 'string') {
      try { return JSON.parse(reactionCounts); } catch (e) { return {}; }
    }
    return reactionCounts as Record<string, number>;
  })();

  const isAuthor = user?.id === comment.userId;
  const isPostOwner = user?.id === postOwnerId;
  const canDelete = isAuthor || isPostOwner;

  return (
    <div className="border-2 border-black rounded-lg p-3 sm:p-4 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
      <div className="flex gap-3">
        {/* Reaction Picker (show on hover) */}
        <div className="relative mr-2 flex flex-col items-center">
          <button
            onClick={() => setShowReactions((s) => !s)}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${userReaction ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Smile className="h-5 w-5" />
            <div className="text-xs text-center">{parsedReactionCounts ? Object.values(parsedReactionCounts).reduce((a,b)=>a+b,0) : 0}</div>
          </button>

          {showReactions && (
            <div onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)} className="absolute left-0 top-10 z-20 bg-white border-2 border-black rounded-lg p-2 flex gap-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button key={e.key} onClick={() => handleReaction(e.key as any)} disabled={reactMutation.isPending} className={`p-2 rounded hover:bg-gray-100 ${userReaction === e.key ? 'ring-2 ring-orange-300' : ''}`} title={e.key}>
                  <div className="text-lg text-center">{e.label}</div>
                  <div className="text-xs text-center">{parsedReactionCounts[e.key] || 0}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <Avatar className="h-8 w-8 border-2 border-black">
              <AvatarFallback className="bg-gray-200 text-black font-semibold text-xs">
                {getInitials(author.name, author.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setLocation(`/users/${author.username}`)}
                  className="font-semibold hover:underline text-sm"
                >
                  {author.username || author.name}
                </button>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCommentMutation.mutate({ commentId: comment.id })}
                    className="text-red-600 hover:text-red-700 h-6 px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mt-1 text-sm">{comment.content}</p>
              
              {/* Action Buttons */}
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please login to reply");
                      return;
                    }
                    setShowReplyForm(!showReplyForm);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  Reply
                </button>
                {replyCount > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
                  >
                    {showReplies ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {showReplyForm && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="border-2 border-black text-sm"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{replyContent.length}/1000</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent("");
                        }}
                        className="border-2 border-black"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleReply}
                        disabled={replyMutation.isPending || !replyContent.trim()}
                        className="border-2 border-black"
                        style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
                      >
                        Post Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies List */}
              {showReplies && replies && replies.length > 0 && (
                <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                  {replies.map((reply: any) => (
                    <CommentItem
                      key={reply.comment.id}
                      comment={reply.comment}
                      author={reply.author}
                      postId={postId}
                      postOwnerId={postOwnerId}
                      reactionCounts={
                        reply.reactionCounts ? (typeof reply.reactionCounts === 'string' ? JSON.parse(reply.reactionCounts) : reply.reactionCounts) : {}
                      }
                      onDeleted={() => {
                        utils.comment.getReplies.invalidate({ parentId: comment.id });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
