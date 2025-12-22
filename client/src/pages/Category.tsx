import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { rustApi } from "@/lib/rustBack";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug || "";
  const [, setLocation] = useLocation();

  const { data: category } = rustApi.category.getBySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: posts } = rustApi.post.getFeed.useQuery({ limit: 20, offset: 0, categoryId: category?.id });

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">Category not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Category: {category.name}</h1>
            <Button onClick={() => setLocation('/feed')}>Back to Feed</Button>
          </div>
        </div>

        <div className="space-y-6">
          {posts && posts.length > 0 ? (
            posts.map((p) => (
              <PostCard
                key={p.post.id}
                post={p.post}
                author={p.author}
                tags={p.tags}
                likeCount={p.likeCount}
                commentCount={p.commentCount}
                isLiked={p.isLiked}
                isBookmarked={p.isBookmarked}
                category={p.category || null}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">No posts in this category yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
