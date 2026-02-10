import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { useAuthState } from "@/hooks/useAuthState";
import { trpc } from "@/lib/trpc";
import { Sparkles, Users, Zap, BookOpen } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, loading } = useAuthState();
  const [, setLocation] = useLocation();
  const { data: topPosts } = trpc.post.getFeed.useQuery({
    limit: 6,
    sortBy: "popular",
  });
  const { data: trending } = trpc.post.getFeed.useQuery({ limit: 3, sortBy: 'trending' });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/feed");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4" style={{ backgroundColor: "var(--sketch-gray-light)" }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Share Your Knowledge
            <br />
            <span className="sketch-underline" style={{ color: "var(--sketch-blue)" }}>
              With The World
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
            A creative blogging platform where developers, designers, and thinkers come together to
            share ideas, stories, and expertise in a hand-drawn, approachable environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 w-full sm:w-auto border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/login")}
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 w-full sm:w-auto border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why BLOZHIK?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 sm:p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-blue)" }}
              >
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">Markdown Support</h3>
              <p className="text-gray-600 text-sm">
                Write in Markdown or plain text with live preview and beautiful rendering.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-pink)" }}
              >
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">Engaged Community</h3>
              <p className="text-gray-600 text-sm">
                Connect with readers through comments, likes, and meaningful discussions.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-yellow)" }}
              >
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">Tag System</h3>
              <p className="text-gray-600 text-sm">
                Organize and discover content with powerful tagging and filtering.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-blue)" }}
              >
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">Draft & Publish</h3>
              <p className="text-gray-600 text-sm">
                Save drafts and publish when ready. Full control over your content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Posts Section */}
      {topPosts && topPosts.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: "var(--sketch-gray-light)" }}>
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {topPosts.slice(0, 6).map((item) => (
                <PostCard
                  key={item.post.id}
                  post={item.post}
                  author={item.author}
                  tags={item.tags}
                  likeCount={item.likeCount}
                  commentCount={item.commentCount}
                  isLiked={item.isLiked}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Now Section */}
      {trending && trending.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: "var(--sketch-gray-light)" }}>
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Trending now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trending.map((item) => (
                <PostCard
                  key={`trending-landing-${item.post.id}`}
                  post={item.post}
                  author={item.author}
                  tags={item.tags}
                  likeCount={item.likeCount}
                  commentCount={item.commentCount}
                  isLiked={item.isLiked}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-white border-t-2 border-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to Start Writing?</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8">
            Join our community and share your unique perspective with the world.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/register")}
            className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 w-full sm:w-auto border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
            style={{ backgroundColor: "var(--sketch-pink)", color: "white" }}
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm">© {new Date().getFullYear()} BLOZHIK. A creative space for sharing knowledge.</p>
        </div>
      </footer>
    </div>
  );
}
