import { useState } from 'react';
import { rustApi } from '../lib/rustBack';
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
  
  const { data: overview, isLoading: loadingOverview } = rustApi.admin.statistics.overview.useQuery();
  const { data: usersData } = rustApi.admin.statistics.users.useQuery({ days });
  const { data: contentData } = rustApi.admin.statistics.content.useQuery({ days });
  const { data: engagementData } = rustApi.admin.statistics.engagement.useQuery({ days });
  const { data: userMetricsData } = rustApi.admin.statistics.userMetrics.useQuery({ days });
  
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
      retentionRate: userMetricsData?.retentionRate || 0,
      churnRate: userMetricsData?.churnRate || 0,
      newUsersPerDay: userMetricsData?.newUsersPerDay || 0,
      avgPostsPerUser: userMetricsData?.avgPostsPerUser || 0,
      avgCommentsPerUser: userMetricsData?.avgCommentsPerUser || 0
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
          {stats.growth.users.length > 0 ? (
            <>
              <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Total new users: {stats.growth.users.reduce((sum: number, p: { count: number }) => sum + p.count, 0)}</span>
                <span>Avg/day: {(stats.growth.users.reduce((sum: number, p: { count: number }) => sum + p.count, 0) / stats.growth.users.length).toFixed(1)}</span>
              </div>
              <div className="h-64 flex items-end justify-between space-x-1">
                {stats.growth.users.map((point: { date: string; count: number }, index: number) => {
                  const maxCount = Math.max(...stats.growth.users.map((p: { count: number }) => p.count), 1);
                  const height = Math.max((point.count / maxCount) * 100, 5);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded text-xs whitespace-nowrap">
                        {point.count} users
                      </div>
                      <div
                        className="w-full bg-blue-500 dark:bg-blue-400 rounded-t hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                        style={{ height: `${height}%` }}
                      ></div>
                      {index % Math.ceil(stats.growth.users.length / 7) === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                          {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Content Growth</h3>
          {stats.growth.posts.length > 0 ? (
            <>
              <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Total new posts: {stats.growth.posts.reduce((sum: number, p: { count: number }) => sum + p.count, 0)}</span>
                <span>Avg/day: {(stats.growth.posts.reduce((sum: number, p: { count: number }) => sum + p.count, 0) / stats.growth.posts.length).toFixed(1)}</span>
              </div>
              <div className="h-64 flex items-end justify-between space-x-1">
                {stats.growth.posts.map((point: { date: string; count: number }, index: number) => {
                  const maxCount = Math.max(...stats.growth.posts.map((p: { count: number }) => p.count), 1);
                  const height = Math.max((point.count / maxCount) * 100, 5);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded text-xs whitespace-nowrap">
                        {point.count} posts
                      </div>
                      <div
                        className="w-full bg-green-500 dark:bg-green-400 rounded-t hover:bg-green-600 dark:hover:bg-green-500 transition-colors"
                        style={{ height: `${height}%` }}
                      ></div>
                      {index % Math.ceil(stats.growth.posts.length / 7) === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                          {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Engagement & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Categories</h3>
          <div className="space-y-4">
            {stats.engagement.topCategories.length > 0 ? (
              (() => {
                const maxCount = Math.max(...stats.engagement.topCategories.map((c: { count: number }) => c.count), 1);
                return stats.engagement.topCategories.map((category: { name: string; count: number }, index: number) => {
                  const percentage = (category.count / maxCount) * 100;
                  const icons = ['🏷️', '🎨', '💼', '🔧', '📚'];
                  return (
                    <div key={category.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{icons[index] || '📁'}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          {category.count} posts
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Likes per Post</span>
                <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.avgLikesPerPost.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats.engagement.avgLikesPerPost / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Comments per Post</span>
                <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.avgCommentsPerPost.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats.engagement.avgCommentsPerPost / 5) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Most Active Hour</span>
                <span className="text-2xl font-bold text-black dark:text-white">{stats.engagement.mostActiveHour}:00</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Peak posting time</div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Retention Rate</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.userMetrics.retentionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.userMetrics.retentionRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Users/Day</span>
                <span className="text-2xl font-bold text-black dark:text-white">{stats.userMetrics.newUsersPerDay}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Average growth rate</div>
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