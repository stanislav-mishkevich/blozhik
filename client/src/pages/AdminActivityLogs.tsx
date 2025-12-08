import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Download, 
  Filter, 
  Search,
  User,
  FileText,
  MessageSquare,
  Heart,
  Flag,
  Ban,
  Shield,
  Eye
} from 'lucide-react';

// Типы активностей на сайте
type ActivityType = 
  | 'post_created' | 'post_updated' | 'post_deleted' | 'post_published' | 'post_viewed'
  | 'comment_created' | 'comment_updated' | 'comment_deleted'
  | 'like_added' | 'like_removed'
  | 'reaction_added' | 'reaction_removed'
  | 'follow_user' | 'unfollow_user'
  | 'bookmark_added' | 'bookmark_removed'
  | 'report_created' | 'report_resolved' | 'report_dismissed'
  | 'user_registered' | 'user_login' | 'user_logout'
  | 'user_banned' | 'user_unbanned' | 'role_changed'
  | 'notification_sent' | 'notification_read';

interface ActivityLog {
  id: number;
  userId: number;
  username?: string;
  action: ActivityType;
  targetType: 'post' | 'comment' | 'user' | 'report' | 'system';
  targetId?: number;
  targetName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminActivityLogs() {
  const [location] = useLocation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    activityType: '',
    targetType: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50
  });

  // Получаем реальные данные из audit_logs
  const { data: logsData, refetch, isLoading } = trpc.admin.auditLogs.list.useQuery({
    limit: filters.limit,
    action: filters.activityType || undefined,
  });

  useEffect(() => {
    if (logsData?.logs) {
      // Преобразуем данные из БД в формат для отображения
      const transformedLogs = logsData.logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        username: log.username || log.name || (log.userId ? `User#${log.userId}` : 'System'),
        action: log.action,
        targetType: log.targetType || 'system',
        targetId: log.targetId,
        details: log.details ? JSON.parse(log.details) : {},
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      }));
      setLogs(transformedLogs);
    }
  }, [logsData]);

  const handleExport = (format: 'json' | 'csv') => {
    const dataToExport = logs;
    
    if (format === 'json') {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const headers = ['ID', 'Date', 'User', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address'];
      const rows = dataToExport.map(log => [
        log.id,
        log.createdAt,
        log.username || `User ${log.userId}`,
        log.action,
        log.targetType,
        log.targetId || '',
        JSON.stringify(log.details),
        log.ipAddress || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getActionIcon = (action: ActivityType) => {
    if (action.includes('post')) return <FileText className="h-4 w-4" />;
    if (action.includes('comment')) return <MessageSquare className="h-4 w-4" />;
    if (action.includes('like') || action.includes('reaction')) return <Heart className="h-4 w-4" />;
    if (action.includes('report')) return <Flag className="h-4 w-4" />;
    if (action.includes('ban')) return <Ban className="h-4 w-4" />;
    if (action.includes('role')) return <Shield className="h-4 w-4" />;
    if (action.includes('view')) return <Eye className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getActionColor = (action: ActivityType) => {
    if (action.includes('delete') || action.includes('ban')) return 'text-black dark:text-white font-black';
    if (action.includes('create') || action.includes('add')) return 'text-black dark:text-white font-black';
    if (action.includes('update')) return 'text-gray-600 dark:text-gray-400 font-bold';
    return 'text-gray-600 dark:text-gray-400 font-bold';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!log.username?.toLowerCase().includes(searchLower) &&
          !log.action.toLowerCase().includes(searchLower) &&
          !log.targetName?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (filters.activityType && log.action !== filters.activityType) return false;
    if (filters.targetType && log.targetType !== filters.targetType) return false;
    return true;
  });

  return (
    <AdminHeader title="Activity Logs" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                Complete history of all user interactions and system events
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('json')}
                variant="outline"
                className="flex items-center gap-2 border-2 border-black rounded-lg"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 bg-black text-white border-2 border-black rounded-lg hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 border-2 border-black rounded-lg sketch-shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="activity-search" className="block text-sm font-bold text-black dark:text-white mb-2">
                  <Search className="inline h-4 w-4 mr-1" />
                  Search
                </label>
                <input
                  id="activity-search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-black dark:border-white rounded-lg dark:bg-gray-900 font-bold"
                  placeholder="Search by user, action, or target..."
                />
              </div>
              
              <div>
                <label htmlFor="activity-type" className="block text-sm font-bold text-black dark:text-white mb-2">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Activity Type
                </label>
                <select
                  id="activity-type"
                  value={filters.activityType}
                  onChange={(e) => setFilters({...filters, activityType: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-black dark:border-white rounded-lg dark:bg-gray-900 font-bold"
                >
                  <option value="">All Activities</option>
                  <option value="post_created">Post Created</option>
                  <option value="post_published">Post Published</option>
                  <option value="post_viewed">Post Viewed</option>
                  <option value="comment_created">Comment Created</option>
                  <option value="like_added">Like Added</option>
                  <option value="reaction_added">Reaction Added</option>
                  <option value="report_created">Report Created</option>
                  <option value="user_registered">User Registered</option>
                  <option value="user_login">User Login</option>
                </select>
              </div>

              <div>
                <label htmlFor="target-type" className="block text-sm font-bold text-black dark:text-white mb-2">
                  Target Type
                </label>
                <select
                  id="target-type"
                  value={filters.targetType}
                  onChange={(e) => setFilters({...filters, targetType: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-black dark:border-white rounded-lg dark:bg-gray-900 font-bold"
                >
                  <option value="">All Types</option>
                  <option value="post">Post</option>
                  <option value="comment">Comment</option>
                  <option value="user">User</option>
                  <option value="report">Report</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-4 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Total Events</p>
                  <p className="text-2xl font-black text-black dark:text-white">{filteredLogs.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-black dark:text-white" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-4 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Posts</p>
                  <p className="text-2xl font-black text-black dark:text-white">
                    {filteredLogs.filter(l => l.action.includes('post')).length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-black dark:text-white" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-4 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Comments</p>
                  <p className="text-2xl font-black text-black dark:text-white">
                    {filteredLogs.filter(l => l.action.includes('comment')).length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-black dark:text-white" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-4 sketch-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Reactions</p>
                  <p className="text-2xl font-black text-black dark:text-white">
                    {filteredLogs.filter(l => l.action.includes('like') || l.action.includes('reaction')).length}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-black dark:text-white" />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg overflow-hidden sketch-shadow">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Loading activity logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No activity logs found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Activity logs will appear here as users interact with the site
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-black dark:divide-white">
                  <thead className="bg-black dark:bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y-2 divide-black dark:divide-white">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-bold">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-black dark:text-white" />
                            <span className="text-sm font-black text-black dark:text-white">
                              {log.username || `User #${log.userId}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-2 ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                            <span className="text-sm font-black">
                              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-bold">
                          {log.targetName || `${log.targetType} #${log.targetId}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-bold">
                          <details className="cursor-pointer">
                            <summary className="text-black dark:text-white hover:underline font-black">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-black p-2 border-2 border-black dark:border-white overflow-auto max-w-md font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}
