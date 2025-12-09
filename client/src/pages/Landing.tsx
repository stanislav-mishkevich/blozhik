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
      <section className="py-20 px-4" style={{ backgroundColor: "var(--sketch-gray-light)" }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Share Your Knowledge
            <br />
            <span className="sketch-underline" style={{ color: "var(--sketch-blue)" }}>
              With The World
            </span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            A creative blogging platform where developers, designers, and thinkers come together to
            share ideas, stories, and expertise in a hand-drawn, approachable environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/register")}
              className="text-lg px-8 py-6 border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/login")}
              className="text-lg px-8 py-6 border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-blue)" }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Markdown Support</h3>
              <p className="text-gray-600">
                Write in Markdown or plain text with live preview and beautiful rendering.
              </p>
            </div>

            <div className="text-center p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-pink)" }}
              >
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Engaged Community</h3>
              <p className="text-gray-600">
                Connect with readers through comments, likes, and meaningful discussions.
              </p>
            </div>

            <div className="text-center p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-yellow)" }}
              >
                <Zap className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Tag System</h3>
              <p className="text-gray-600">
                Organize and discover content with powerful tagging and filtering.
              </p>
            </div>

            <div className="text-center p-6 border-2 border-black rounded-lg sketch-shadow bg-white">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-black"
                style={{ backgroundColor: "var(--sketch-blue)" }}
              >
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Draft & Publish</h3>
              <p className="text-gray-600">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section className="py-20 px-4 bg-white border-t-2 border-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Writing?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Join our community and share your unique perspective with the world.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/register")}
            className="text-lg px-8 py-6 border-2 border-black sketch-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
            style={{ backgroundColor: "var(--sketch-pink)", color: "white" }}
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm">© {new Date().getFullYear()} BLOZHIK. A creative space for sharing knowledge.</p>
        </div>
      </footer>
    </div>
  );
}
