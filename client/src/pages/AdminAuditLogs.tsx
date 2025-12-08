import { useState } from 'react';
import { trpc } from '../lib/trpc';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';

interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: 'user' | 'post' | 'comment' | 'role' | 'ban' | 'report' | 'system';
  targetId: string;
  targetName?: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminAuditLogs() {
  const [location] = useLocation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({
    admin: '',
    action: '',
    targetType: '',
    dateRange: '7d'
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with real API calls
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      adminId: 'admin1',
      adminUsername: 'superadmin',
      action: 'user_banned',
      targetType: 'user',
      targetId: 'user123',
      targetName: 'baduser',
      changes: {
        reason: 'Spam content',
        duration: 7,
        bannedAt: '2024-01-15T10:00:00Z'
      },
      ipAddress: '192.168.1.100',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      adminId: 'admin2',
      adminUsername: 'moderator',
      action: 'post_deleted',
      targetType: 'post',
      targetId: 'post456',
      targetName: 'Offensive Post Title',
      changes: {
        reason: 'Violates community guidelines',
        deletedAt: '2024-01-14T14:30:00Z'
      },
      ipAddress: '192.168.1.101',
      createdAt: '2024-01-14T14:30:00Z'
    },
    {
      id: '3',
      adminId: 'admin1',
      adminUsername: 'superadmin',
      action: 'role_changed',
      targetType: 'user',
      targetId: 'user789',
      targetName: 'johndoe',
      changes: {
        oldRole: 'user',
        newRole: 'admin',
        changedAt: '2024-01-13T09:15:00Z'
      },
      ipAddress: '192.168.1.100',
      createdAt: '2024-01-13T09:15:00Z'
    }
  ];

  const handleExportLogs = (format: 'json' | 'csv') => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : mockLogs;
    
    if (format === 'json') {
      // Экспорт в JSON
      const json = JSON.stringify(logsToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Экспорт в CSV
      const headers = ['ID', 'Date', 'Admin', 'Action', 'Target Type', 'Target ID', 'Target Name', 'IP Address', 'Changes'];
      const rows = logsToExport.map(log => [
        log.id,
        log.createdAt,
        log.adminUsername,
        log.action,
        log.targetType,
        log.targetId,
        log.targetName || '',
        log.ipAddress || '',
        JSON.stringify(log.changes)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban')) return 'text-red-600 dark:text-red-400';
    if (action.includes('create') || action.includes('add')) return 'text-green-600 dark:text-green-400';
    if (action.includes('update') || action.includes('change')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getActionText = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTargetTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'post': return '📝';
      case 'comment': return '💬';
      case 'role': return '🔑';
      case 'ban': return '🚫';
      case 'report': return '⚠️';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.admin && !log.adminUsername.toLowerCase().includes(filters.admin.toLowerCase())) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.targetType && log.targetType !== filters.targetType) return false;
    return true;
  });

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
      <AdminNav currentPath={location} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Complete history of admin actions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportLogs('json')}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg border-2 border-black flex items-center gap-2"
          >
            <span>📄</span>
            Export JSON
          </button>
          <button
            onClick={() => handleExportLogs('csv')}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg border-2 border-black flex items-center gap-2"
          >
            <span>📊</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin
            </label>
            <input
              type="text"
              value={filters.admin}
              onChange={(e) => setFilters({...filters, admin: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Filter by admin..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="user_banned">User Banned</option>
              <option value="user_unbanned">User Unbanned</option>
              <option value="post_deleted">Post Deleted</option>
              <option value="comment_deleted">Comment Deleted</option>
              <option value="role_changed">Role Changed</option>
              <option value="report_resolved">Report Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Type
            </label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters({...filters, targetType: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="post">Post</option>
              <option value="comment">Comment</option>
              <option value="role">Role</option>
              <option value="ban">Ban</option>
              <option value="report">Report</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getTargetTypeIcon(log.targetType)}</span>
                      <div>
                        <div className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {log.targetType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.adminUsername}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {log.targetName || log.targetId}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {log.targetId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Audit Log Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Action:</span>
                    <p className={`mt-1 ${getActionColor(selectedLog.action)}`}>
                      {getActionText(selectedLog.action)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Admin:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">{selectedLog.adminUsername}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Target Type:</span>
                    <p className="mt-1 text-gray-900 dark:text-white capitalize">{selectedLog.targetType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Target:</span>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-gray-900 dark:text-white">{selectedLog.targetName || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedLog.targetId}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Changes:</span>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>

                {(selectedLog.ipAddress || selectedLog.userAgent) && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Technical Details:</span>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      {selectedLog.ipAddress && (
                        <p className="text-gray-900 dark:text-white">IP: {selectedLog.ipAddress}</p>
                      )}
                      {selectedLog.userAgent && (
                        <p className="text-gray-500 dark:text-gray-400 truncate" title={selectedLog.userAgent}>
                          User Agent: {selectedLog.userAgent}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg border-2 border-black"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}