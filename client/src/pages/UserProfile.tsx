import { useParams, useLocation, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuthState } from "@/hooks/useAuthState";
import { Settings, Calendar, FileText, Heart, MessageCircle, Shield, Award, Ban, Bookmark, TrendingUp, Users, Home, ChevronRight, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function UserProfile() {
  const params = useParams();
  const username = params.username || "";
  const { user: currentUser } = useAuthState();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const tabFromUrl = searchParams.get("tab") || "posts";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery({ username });
  const userId = profile?.id || 0;
  const { data: posts } = trpc.post.getUserPosts.useQuery({
    userId,
    includeUnpublished: currentUser?.id === userId,
  });

  // All hooks must be called before any conditional returns
  const utils = trpc.useUtils();

  const isOwnProfile = currentUser?.id === userId;

  const { data: bookmarkedPosts } = trpc.bookmark.list.useQuery(
    { userId },
    { enabled: isOwnProfile && !!userId }
  );
  const { data: followers } = trpc.follow.getFollowers.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const { data: following } = trpc.follow.getFollowing.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const followMutation = trpc.follow.toggle.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate({ userId });
    }
  });

  const { data: userBadges } = trpc.badge.getUserBadges.useQuery({ userId });
  const { data: blockStatus } = trpc.block.isBlocked.useQuery(
    { userId },
    { enabled: !!currentUser && currentUser.id !== userId }
  );

  const blockMutation = trpc.block.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.blocked ? "User blocked" : "User unblocked");
      utils.block.isBlocked.invalidate({ userId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update block status");
    }
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return "U";
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    followMutation.mutate({ followingId: userId });
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    
    const confirmMessage = blockStatus?.blocked 
      ? "Are you sure you want to unblock this user?" 
      : "Are you sure you want to block this user? You won't see their posts or comments.";
    
    if (confirm(confirmMessage)) {
      blockMutation.mutate({ userId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">User not found</div>
        </div>
      </div>
    );
  }

  const renderPostsList = (postsList: typeof posts) => {
    if (!postsList || postsList.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{isOwnProfile ? "You haven't written any posts yet" : "No posts yet"}</p>
          {isOwnProfile && (
            <Button
              onClick={() => setLocation("/write")}
              className="mt-4 border-2 border-black sketch-shadow"
              style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
            >
              Write Your First Post
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {postsList.map((post) => (
          <button
            key={post.id}
            onClick={() => setLocation(`/posts/${post.id}`)}
            className="w-full text-left border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {!post.published && (
                    <Badge variant="secondary" className="border border-black">
                      Draft
                    </Badge>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {(post as any).likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {(post as any).commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderUserList = (users: any[] | undefined, emptyMessage: string) => {
    if (!users || users.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((item: any) => {
          const user = item.follower || item.following;
          return (
            <button
              key={user.id}
              onClick={() => setLocation(`/users/${user.username}`)}
              className="flex items-center gap-3 p-4 border-2 border-black rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
            >
              <Avatar className="h-12 w-12 border-2 border-black">
                <AvatarFallback className="bg-gray-200 text-black font-semibold">
                  {getInitials(user.name, user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-semibold">{user.username || user.name}</div>
                {user.bio && (
                  <div className="text-sm text-gray-600 line-clamp-1">{user.bio}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <button onClick={() => setLocation('/')} className="hover:text-gray-900 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => setLocation('/feed')} className="hover:text-gray-900">
            Feed
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium flex items-center gap-1 truncate max-w-[200px]">
            <UserIcon className="h-4 w-4" />
            {profile.username || profile.name || "User"}
          </span>
        </div>

        {/* Profile Header */}
        <div className="bg-white border-2 border-black rounded-lg p-4 sm:p-6 md:p-8 sketch-shadow mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-black">
              <AvatarFallback className="bg-gray-200 text-black font-bold text-3xl">
                {getInitials(profile.name, profile.username)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {profile.username || profile.name || "Anonymous"}
                  </h1>
                  {profile.name && profile.username && (
                    <p className="text-gray-600">{profile.name}</p>
                  )}
                </div>
                {isOwnProfile ? (
                  <Button
                    onClick={() => setLocation("/settings")}
                    variant="outline"
                    className="border-2 border-black sketch-shadow-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleFollow} className="bg-blue-500 text-white">
                      {profile.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    {currentUser && (
                      <Button 
                        onClick={handleBlock} 
                        variant="outline"
                        className="border-2 border-black sketch-shadow-sm"
                        title={blockStatus?.blocked ? "Unblock user" : "Block user"}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {isOwnProfile && (
                  <Button onClick={() => setLocation('/drafts')} variant="ghost" className="ml-2 border-2 border-black">Drafts</Button>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{profile.bio}</p>
              )}

              {/* Badges */}
              {userBadges && userBadges.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-sm">Achievements</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userBadges.map((badge) => (
                      <Badge 
                        key={badge.id} 
                        variant="secondary" 
                        className="border border-black sketch-shadow-sm"
                        title={badge.description}
                      >
                        <span className="mr-1">{badge.icon}</span>
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border-2 border-black">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.postCount}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.totalLikes}</div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.stats.commentCount}</div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.following}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.bookmarks}</div>
                  <div className="text-sm text-gray-600">Bookmarks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.views ?? 0}</div>
                  <div className="text-sm text-gray-600">Views (30d)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-2 border-black bg-white mb-6 sketch-shadow-sm">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
              <Badge variant="secondary" className="ml-1">{profile.stats.postCount}</Badge>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarks
                <Badge variant="secondary" className="ml-1">{profile.bookmarks}</Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Followers
              <Badge variant="secondary" className="ml-1">{profile.followers}</Badge>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Following
              <Badge variant="secondary" className="ml-1">{profile.following}</Badge>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
            <h2 className="text-2xl font-bold mb-6">
              {isOwnProfile ? "My Posts" : "Posts"}
            </h2>
            {renderPostsList(posts)}
          </TabsContent>

          {/* Bookmarks Tab */}
          {isOwnProfile && (
            <TabsContent value="bookmarks" className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
              <h2 className="text-2xl font-bold mb-6">Bookmarked Posts</h2>
              {bookmarkedPosts && bookmarkedPosts.length > 0 ? (
                <div className="space-y-4">
                  {bookmarkedPosts.map((item: any) => {
                    const postData = item.post;
                    const authorData = item.author;
                    return (
                      <button
                        key={postData.id}
                        onClick={() => setLocation(`/posts/${postData.id}`)}
                        className="w-full text-left border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1 line-clamp-1">{postData.title}</h3>
                            {postData.excerpt && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{postData.excerpt}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>By {authorData.username || authorData.name}</span>
                              <span>•</span>
                              <span>
                                {new Date(postData.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookmarked posts yet</p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Followers Tab */}
          <TabsContent value="followers" className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
            <h2 className="text-2xl font-bold mb-6">Followers</h2>
            {renderUserList(followers, isOwnProfile ? "You don't have any followers yet" : "No followers yet")}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
            <h2 className="text-2xl font-bold mb-6">Following</h2>
            {renderUserList(following, isOwnProfile ? "You're not following anyone yet" : "Not following anyone yet")}
          </TabsContent>

          {/* Analytics Tab */}
          {isOwnProfile && (
            <TabsContent value="analytics" className="bg-white border-2 border-black rounded-lg p-6 md:p-8 sketch-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Performance</h2>
                <Button
                  onClick={() => setLocation("/analytics")}
                  variant="outline"
                  className="border-2 border-black"
                >
                  Detailed Analytics
                </Button>
              </div>
              
              {profile.stats.postCount > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-black rounded-lg p-4 sketch-shadow-sm">
                      <h3 className="font-bold mb-2">Average Engagement</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Likes per Post</span>
                            <span className="font-semibold">
                              {(profile.stats.totalLikes / profile.stats.postCount).toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-500"
                              style={{ 
                                width: `${Math.min(100, (profile.stats.totalLikes / profile.stats.postCount / 10) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Comments per Post</span>
                            <span className="font-semibold">
                              {(profile.stats.commentCount / profile.stats.postCount).toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ 
                                width: `${Math.min(100, (profile.stats.commentCount / profile.stats.postCount / 5) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-black rounded-lg p-4 sketch-shadow-sm">
                      <h3 className="font-bold mb-2">Content Stats</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Engagement</span>
                          <span className="font-bold">{profile.stats.totalLikes + profile.stats.commentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Views (30d)</span>
                          <span className="font-bold">{profile.views ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Followers</span>
                          <span className="font-bold">{profile.followers}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Tip:</strong> Visit the detailed analytics page to see charts, trends, and more insights about your content performance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">No analytics data yet</p>
                  <p className="text-sm mt-2">Start creating posts to see your performance metrics</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
