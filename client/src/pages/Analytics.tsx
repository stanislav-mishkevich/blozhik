import { Header } from '@/components/Header';
import { trpc } from '@/lib/trpc';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthState } from '@/hooks/useAuthState';
import { useEffect, useState } from 'react';

export default function Analytics() {
  const { user } = useAuthState();
  const { data: posts } = trpc.post.getUserPosts.useQuery({ userId: user?.id ?? 0, includeUnpublished: true }, { enabled: !!user });
  const { data: authorStats } = trpc.analytics.authorViews.useQuery({ userId: user?.id ?? 0, days: 30 }, { enabled: !!user });
  const { data: topPosts } = trpc.analytics.topPosts.useQuery({ days: 30, limit: 3 }, { enabled: !!user });
  const { data: topAuthors } = trpc.analytics.topAuthors.useQuery({ days: 30, limit: 3 }, { enabled: !!user });
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const viewsQuery = trpc.analytics.postViews.useQuery({ postId: selectedPost ?? 0, days: 30 }, { enabled: !!selectedPost });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <h1 className="text-2xl font-bold mb-4">Analytics</h1>
            <div className="flex gap-4">
              <div className="w-1/3">
              <h3 className="font-semibold mb-2">Your Posts</h3>
              <div className="space-y-2">
                                <div className="mt-4 text-sm text-gray-600">Total views last 30 days: {authorStats?.views ?? 0}</div>
                                <div className="mt-2 text-sm text-gray-600">Top posts</div>
                                {topPosts && topPosts.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {topPosts.map((p: any) => (
                                      <div key={p.post.id} className="p-2 border-2 border-gray-200 rounded">
                                        <div className="font-semibold">{p.post.title || 'Untitled'}</div>
                                        <div className="text-sm text-gray-500">{p.views} views</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-4 text-sm text-gray-600">Top authors</div>
                                {topAuthors && topAuthors.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {topAuthors.map((a: any) => (
                                      <div key={a.user.id} className="p-2 border-2 border-gray-200 rounded">
                                        <div className="font-semibold">{a.user.username || a.user.name || `@${a.user.username}`}</div>
                                        <div className="text-sm text-gray-500">{a.views} views</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                {posts?.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPost(p.id)} className="w-full text-left p-2 border-2 border-gray-200 rounded-lg hover:border-gray-300">{p.title || 'Untitled'}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              {selectedPost ? (
                <div>
                  <h3 className="font-semibold mb-2">Views (last 30 days)</h3>
                  {viewsQuery.isLoading && <div>Loading...</div>}
                  {viewsQuery.data && (
                    <div className="space-y-2">
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer>
                          <LineChart data={viewsQuery.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2">
                        {viewsQuery.data.map((row: any) => (
                          <div key={row.day} className="p-2 border-b-2 border-gray-100 flex justify-between">
                            <div>{row.day}</div>
                            <div>{row.views}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>Select a post to view analytics</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
