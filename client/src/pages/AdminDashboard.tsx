import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useAuthState } from '@/hooks/useAuthState';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { 
  Users, 
  FileText, 
  MessageCircle, 
  Flag, 
  Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const { user } = useAuthState();
  const [location, setLocation] = useLocation();

  const { data: statsData, refetch } = trpc.admin.statistics.overview.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);

  // Проверка прав доступа
  const roleLevel = (role: string) => {
    const levels: Record<string, number> = { user: 0, moderator: 1, admin: 2, superadmin: 3, god: 4 };
    return levels[role] || 0;
  };

  const hasAccess = (minRole: string) => {
    return roleLevel(user?.role || 'user') >= roleLevel(minRole);
  };

  // Если пользователь не имеет прав
  if (!hasAccess('moderator')) {
    return (
      <AdminHeader title="Access Denied">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader title="Admin Dashboard" showBack={false}>
      <div className="flex bg-gray-50 dark:bg-black">
        <AdminNav currentPath={location} />
        
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{/* Dashboard Overview */}
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2 text-black dark:text-white">Dashboard Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold">Welcome to BLOZHIK admin panel</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-black text-black dark:text-white mt-2">{stats.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white dark:text-black" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Total Posts</p>
                  <p className="text-3xl font-black text-black dark:text-white mt-2">{stats.totalPosts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white dark:text-black" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Total Comments</p>
                  <p className="text-3xl font-black text-black dark:text-white mt-2">{stats.totalComments || 0}</p>
                </div>
                <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white dark:text-black" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Total Likes</p>
                  <p className="text-3xl font-black text-black dark:text-white mt-2">{stats.totalLikes || 0}</p>
                </div>
                <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {hasAccess('admin') && (
            <div className="mt-8">
              <h2 className="text-xl font-black mb-4 text-black dark:text-white">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setLocation('/admin/create-post')}
                  className="h-24 rounded-lg flex flex-col items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
                >
                  <FileText className="h-6 w-6" />
                  <span className="font-black">Create Post</span>
                </Button>

                {hasAccess('superadmin') && (
                  <Button
                    onClick={() => setLocation('/admin/create-user')}
                    className="h-24 rounded-lg flex flex-col items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-black">Create User</span>
                  </Button>
                )}

                <Button
                  onClick={() => setLocation('/admin/reports')}
                  className="h-24 rounded-lg flex flex-col items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
                >
                  <Flag className="h-6 w-6" />
                  <span className="font-black">View Reports</span>
                </Button>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </AdminHeader>
  );
}