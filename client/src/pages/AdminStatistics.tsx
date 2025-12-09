import { useState } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';

interface StatsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    activeUsersLast7Days: number;
    newUsersLast7Days: number;
    totalReports: number;
    bannedUsers: number;
  };
  growth: {
    users: Array<{ date: string; count: number }>;
    posts: Array<{ date: string; count: number }>;
    comments: Array<{ date: string; count: number }>;
  };
  engagement: {
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    mostActiveHour: number;
    topCategories: Array<{ name: string; count: number }>;
  };
  userMetrics: {
    retentionRate: number;
    churnRate: number;
    newUsersPerDay: number;
    avgPostsPerUser: number;
    avgCommentsPerUser: number;
  };
}

export default function AdminStatistics() {
  const [location] = useLocation();
  const [timeRange, setTimeRange] = useState('30d');
  
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  
  const { data: overview, isLoading: loadingOverview } = trpc.admin.statistics.overview.useQuery();
  const { data: usersData } = trpc.admin.statistics.users.useQuery({ days });
  const { data: contentData } = trpc.admin.statistics.content.useQuery({ days });
  const { data: engagementData } = trpc.admin.statistics.engagement.useQuery({ days });
  
  const loading = loadingOverview;
  
  const stats = overview ? {
    overview: {
      totalUsers: overview.totalUsers || 0,
      totalPosts: overview.totalPosts || 0,
      totalComments: overview.totalComments || 0,
      totalLikes: overview.totalLikes || 0,
      activeUsersLast7Days: overview.activeUsersLast7Days || 0,
      newUsersLast7Days: overview.newUsersLast7Days || 0,
      totalReports: overview.pendingReports || 0,
      bannedUsers: overview.bannedUsers || 0
    },
    growth: {
      users: usersData?.users || [],
      posts: contentData?.posts || [],
      comments: contentData?.comments || []
    },
    engagement: {
      avgLikesPerPost: engagementData?.avgLikesPerPost || 0,
      avgCommentsPerPost: engagementData?.avgCommentsPerPost || 0,
      mostActiveHour: engagementData?.mostActiveHour || 14,
      topCategories: engagementData?.topCategories || []
    },
    userMetrics: {
      retentionRate: 0,
      churnRate: 0,
      newUsersPerDay: 0,
      avgPostsPerUser: overview.totalPosts && overview.totalUsers 
        ? Number((overview.totalPosts / overview.totalUsers).toFixed(2))
        : 0,
      avgCommentsPerUser: overview.totalComments && overview.totalUsers
        ? Number((overview.totalComments / overview.totalUsers).toFixed(2))
        : 0
    }
  } : null;

  if (loading) {
    return (
      <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <AdminHeader title="Site Statistics" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics for your platform</p>
          </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-lg border-2 border-black dark:border-white dark:bg-gray-900 px-3 py-2 font-bold"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                +{stats.overview.newUsersLast7Days} this week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Posts</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.totalPosts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">💬</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Comments</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.totalComments.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.engagement.avgCommentsPerPost.toFixed(1)} per post
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">❤️</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Likes</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.engagement.avgLikesPerPost.toFixed(1)} per post
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Users</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.activeUsersLast7Days}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🚫</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reports</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.overview.totalReports}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending review</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🚷</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Banned Users</h3>
              <p className="text-2xl font-bold text-gray-600">{stats.overview.bannedUsers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Currently banned</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Retention Rate</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{stats.userMetrics.retentionRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">User retention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Growth</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats.growth.users.length > 0 ? (
              stats.growth.users.map((point: { date: string; count: number }, index: number) => {
                const maxCount = Math.max(...stats.growth.users.map((p: { count: number }) => p.count));
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-black dark:bg-white rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center w-full">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Content Growth</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats.growth.posts.length > 0 ? (
              stats.growth.posts.map((point: { date: string; count: number }, index: number) => {
                const maxCount = Math.max(...stats.growth.posts.map((p: { count: number }) => p.count));
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-black dark:bg-white rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center w-full">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Categories</h3>
          <div className="space-y-3">
            {stats.engagement.topCategories.length > 0 ? (
              stats.engagement.topCategories.map((category: { name: string; count: number }, index: number) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {['🏷️', '🎨', '💼', '👤'][index] || '📁'}
                    </span>
                    <span className="text-gray-900 dark:text-white">{category.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    {category.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Avg Likes per Post</span>
              <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.avgLikesPerPost.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Avg Comments per Post</span>
              <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.avgCommentsPerPost.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Most Active Hour</span>
              <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.mostActiveHour}:00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">User Retention</span>
              <span className="text-2xl font-bold text-black dark:text-white">{stats.userMetrics.retentionRate}%</span>
            </div>
          </div>
        </div>
      </div>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}