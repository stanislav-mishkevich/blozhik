import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/useAuthState";

export default function Saved() {
  const [, setLocation] = useLocation();
  const { user } = useAuthState();
  const { data: bookmarks } = trpc.bookmark.list.useQuery({ userId: user?.id });
  // We'll fetch posts in client as `post.getById` per bookmark
  const postQueries = (bookmarks || []).map(bm => trpc.post.getById.useQuery({ postId: bm.post.id }));
  const utils = trpc.useUtils();

  useEffect(() => {
    // If visiting saved page, and user exists, re-fetch
    if (user?.id) {
      utils.bookmark.list.invalidate({ userId: user.id });
    }
  }, [user?.id, utils]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h2 className="text-2xl font-bold mb-6">Saved Posts</h2>
          {bookmarks && bookmarks.length > 0 ? (
            <div className="space-y-6">
              {bookmarks.map((bm) => (
                <BookmarkRow key={bm.post.id} postId={bm.post.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No saved posts yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookmarkRow({ postId }: { postId: number }) {
  const { data } = trpc.post.getById.useQuery({ postId });
  if (!data || !data.author) return null;
  return (
    <PostCard
      key={data.post.id}
      post={{
        ...data.post,
        createdAt: new Date(data.post.createdAt),
        published: !!data.post.published,
      }}
      author={data.author}
      tags={data.tags}
      likeCount={data.likeCount}
      commentCount={data.commentCount ?? 0}
      isLiked={data.isLiked}
      isBookmarked={true}
      category={data.category ?? undefined}
    />
  );
}
