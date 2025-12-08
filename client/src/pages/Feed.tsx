import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Clock, Heart, Tag, Users, Sparkles, Zap, Filter } from "lucide-react";
import { toast } from "sonner";

const comingSoonToast = (feature: string) => {
  const messages = [
    `🚀 ${feature} coming soon! Our hamsters are working on it...`,
    `⚡ ${feature} is in the oven! It'll be ready when it smells good.`,
    `🎨 ${feature}? We're painting that feature right now!`,
    `🔮 ${feature} will appear... eventually. Magic takes time!`,
    `🎪 ${feature} is still at the circus. It'll come back with tricks!`,
    `🌟 ${feature} is being polished to perfection!`,
    `🎯 ${feature} is on our TODO list... somewhere...`,
    `🦄 ${feature} is as mythical as unicorns... for now!`,
  ];
  toast.info(messages[Math.floor(Math.random() * messages.length)], {
    duration: 3000,
  });
};

export default function Feed() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const tagParam = params.get("tag");
  const categoryParam = params.get("category");
  
  const [sortBy, setSortBy] = useState<"new" | "popular" | "trending">("new");
  const [offset, setOffset] = useState(0);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "trending" | "explore">("all");
  const limit = 20;

  const { data: popularTags } = trpc.tag.getPopular.useQuery({ limit: 10 });
  const { data: categories } = trpc.category.getPopular.useQuery({ limit: 10 });
  const { data: trendingTags } = trpc.tag.getTrending.useQuery({ days: 7, limit: 10 });
  
  const { data: tagData } = trpc.tag.getByName.useQuery(
    { name: tagParam || "" },
    { enabled: !!tagParam }
  );
  const { data: categoryData } = trpc.category.getBySlug.useQuery({ slug: categoryParam || "" }, { enabled: !!categoryParam });

  const { data: posts, isLoading } = trpc.post.getFeed.useQuery({
    limit,
    offset,
    sortBy,
    tagId: tagData?.id,
    categoryId: categoryData?.id,
    followingOnly: followingOnly ? true : undefined,
  });
  const { data: trending } = trpc.post.getFeed.useQuery({ limit: 5, offset: 0, sortBy: 'trending' }, { enabled: true });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const clearTagFilter = () => {
    setLocation("/feed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* View Tabs */}
            <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="mb-6">
              <TabsList className="w-full justify-start border-2 border-black bg-white sketch-shadow-sm">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  All Posts
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="explore" className="flex items-center gap-2" onClick={(e) => {
                  e.preventDefault();
                  comingSoonToast("Explore Page");
                }}>
                  <Zap className="h-4 w-4" />
                  Explore
                  <Badge variant="secondary" className="ml-1 text-xs">Soon</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {/* Sort Options */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <Button
                    variant={sortBy === "new" && !followingOnly ? "default" : "outline"}
                    onClick={() => {
                      setSortBy("new");
                      setFollowingOnly(false);
                      setOffset(0);
                    }}
                    className="border-2 border-black sketch-shadow-sm"
                    style={
                      sortBy === "new" && !followingOnly
                        ? { backgroundColor: "var(--sketch-blue)", color: "white" }
                        : {}
                    }
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    New
                  </Button>
                  <Button
                    variant={followingOnly ? 'default' : 'outline'}
                    onClick={() => { 
                      setFollowingOnly(true);
                      setOffset(0); 
                    }}
                    className="border-2 border-black sketch-shadow-sm"
                    style={followingOnly ? { backgroundColor: 'var(--sketch-green)', color: 'white' } : {}}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Following
                  </Button>
                  <Button
                    variant={sortBy === "popular" && !followingOnly ? "default" : "outline"}
                    onClick={() => {
                      setSortBy("popular");
                      setFollowingOnly(false);
                      setOffset(0);
                    }}
                    className="border-2 border-black sketch-shadow-sm"
                    style={
                      sortBy === "popular" && !followingOnly
                        ? { backgroundColor: "var(--sketch-pink)", color: "white" }
                        : {}
                    }
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Popular
                  </Button>
                  <Button
                    variant={sortBy === "trending" && !followingOnly ? "default" : "outline"}
                    onClick={() => {
                      setSortBy("trending");
                      setFollowingOnly(false);
                      setOffset(0);
                    }}
                    className="border-2 border-black sketch-shadow-sm"
                    style={
                      sortBy === "trending" && !followingOnly
                        ? { backgroundColor: "var(--sketch-yellow)", color: "black" }
                        : {}
                    }
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => comingSoonToast("Advanced Filters")}
                    className="border-2 border-black sketch-shadow-sm ml-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                  </Button>

                  {tagParam && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-2 border-black"
                        style={{ backgroundColor: "var(--sketch-yellow)" }}
                      >
                        #{tagParam}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearTagFilter}
                        className="text-sm"
                      >
                        Clear filter
                      </Button>
                    </div>
                  )}
                </div>

                {/* Posts Grid */}
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="text-xl">Loading posts...</div>
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((item) => (
                      <PostCard
                        key={item.post.id}
                        post={item.post}
                        author={item.author}
                        tags={item.tags}
                        likeCount={item.likeCount}
                        commentCount={item.commentCount}
                        isLiked={item.isLiked}
                        isBookmarked={item.isBookmarked}
                        category={item.category || null}
                      />
                    ))}

                    {posts.length >= limit && (
                      <div className="text-center pt-6">
                        <Button
                          onClick={handleLoadMore}
                          variant="outline"
                          className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border-2 border-black rounded-lg sketch-shadow">
                    <p className="text-xl text-gray-600">No posts found</p>
                    <p className="text-gray-500 mt-2">Be the first to write something!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="mt-6">
                {/* Trending Posts */}
                {trending && trending.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-black rounded-lg p-4 sketch-shadow mb-4">
                      <div className="flex items-center gap-2 text-orange-800">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-bold">🔥 Hot Right Now</span>
                      </div>
                    </div>
                    {trending.map(t => (
                      <PostCard key={`trending-${t.post.id}`} post={t.post} author={t.author} tags={t.tags} likeCount={t.likeCount} commentCount={t.commentCount} isLiked={t.isLiked} isBookmarked={t.isBookmarked} category={t.category || null} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white border-2 border-black rounded-lg sketch-shadow">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl text-gray-600">No trending posts yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-6">
            {/* Popular Tags */}
            <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags && popularTags.length > 0 ? (
                  popularTags.map((item) => (
                    <button
                      key={item.tag.id}
                      onClick={() => setLocation(`/feed?tag=${item.tag.name}`)}
                      className="inline-block"
                    >
                      <Badge
                        variant="outline"
                        className="border-2 border-black hover:bg-yellow-100 transition-colors cursor-pointer"
                        style={{ backgroundColor: "var(--sketch-yellow)" }}
                      >
                        #{item.tag.name} ({item.postCount})
                      </Badge>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tags yet</p>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories && categories.length > 0 ? (
                  categories.map((item) => {
                    const c = item.category;
                    const postCount = item.postCount;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setLocation(`/feed?category=${c.slug}`)}
                        className="inline-block"
                      >
                        <Badge
                          variant="outline"
                          className="border-2 border-black hover:bg-yellow-100 transition-colors cursor-pointer"
                          style={{ backgroundColor: "var(--sketch-yellow)" }}
                        >
                          {c.name} ({postCount})
                        </Badge>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No categories yet</p>
                )}
              </div>
            </div>

              {/* Trending Tags Widget */}
              <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Trending Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingTags && trendingTags.length > 0 ? (
                    trendingTags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setLocation(`/feed?tag=${t.name}`)}
                        className="inline-block"
                      >
                        <Badge
                          variant="outline"
                          className="border-2 border-black hover:bg-yellow-100 transition-colors cursor-pointer"
                          style={{ backgroundColor: "var(--sketch-yellow)" }}
                        >
                          #{t.name} ({t.count})
                        </Badge>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No tags yet</p>
                  )}
                </div>
              </div>

            {/* Write CTA */}
            <div
              className="border-2 border-black rounded-lg p-6 sketch-shadow text-center"
              style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
            >
              <h3 className="font-bold text-lg mb-2">Share Your Story</h3>
              <p className="text-sm mb-4 opacity-90">
                Have something to share? Start writing now!
              </p>
              <Button
                onClick={() => setLocation("/write")}
                variant="outline"
                className="w-full border-2 border-white bg-white text-black hover:bg-gray-100"
              >
                Write a Post
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
