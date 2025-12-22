import { useMemo } from "react";
import { useSearch } from "wouter";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { rustApi } from "@/lib/rustBack";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const searchParams = useSearch();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const query = params.get("q") || "";

  const { data: results, isLoading } = rustApi.search.posts.useQuery(
    { query, limit: 20 },
    { enabled: !!query }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <SearchIcon className="h-8 w-8" />
            Search Results
          </h1>
          {query && (
            <p className="text-gray-600">
              Showing results for: <span className="font-semibold">"{query}"</span>
            </p>
          )}
        </div>

        {!query ? (
          <div className="text-center py-12 bg-white border-2 border-black rounded-lg sketch-shadow">
            <SearchIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-600">Enter a search query to find posts</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">Searching...</div>
          </div>
        ) : results && results.length > 0 ? (
          <div className="space-y-6">
            <p className="text-gray-600 mb-4">Found {results.length} result(s)</p>
            {results.map((item) => (
              <PostCard
                key={item.post.id}
                post={{
                  ...item.post,
                  createdAt: new Date(item.post.createdAt),
                  published: !!item.post.published,
                }}
                author={item.author}
                tags={item.tags}
                likeCount={item.likeCount}
                commentCount={item.commentCount}
                isLiked={item.isLiked}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border-2 border-black rounded-lg sketch-shadow">
            <SearchIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-600">No posts found</p>
            <p className="text-gray-500 mt-2">Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
