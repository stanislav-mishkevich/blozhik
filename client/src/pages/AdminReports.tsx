import { useState, useEffect } from 'react';
import { rustApi } from '@/lib/rustBack';
import AdminHeader from '@/components/AdminHeader';
import AdminNav from '@/components/AdminNav';
import { useLocation } from 'wouter';

interface Report {
  id: string;
  type: 'post' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string; // for posts
  targetContent?: string; // for comments
  targetUsername?: string; // for users
  reason: string;
  description?: string;
  reportedBy: string;
  reportedById: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  action?: string;
}

export default function AdminReports() {
  const [location] = useLocation();
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState({
    status: 'open',
    type: '',
    reason: ''
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: reportsData, refetch } = rustApi.admin.reports.list.useQuery({ limit: 100 });

  useEffect(() => {
    if (reportsData) {
      setReports(reportsData.map((r: any) => ({
        id: String(r.id),
        type: r.targetType,
        targetId: String(r.targetId),
        targetTitle: r.targetTitle || r.postTitle || undefined,
        targetContent: r.targetContent || undefined,
        targetUsername: r.targetUsername || undefined,
        reason: r.reason,
        description: r.description,
        reportedBy: r.reporterName || 'unknown',
        reportedById: String(r.userId),
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        resolvedBy: r.resolvedBy,
        action: r.action
      })));
    }
  }, [reportsData]);

  const resolveReportMutation = rustApi.admin.reports.resolve.useMutation();
  const dismissReportMutation = rustApi.admin.reports.dismiss.useMutation();

  const handleResolveReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    if (!resolutionAction && action === 'resolve') {
      alert('Please select a resolution action');
      return;
    }

    if (action === 'resolve') {
      await resolveReportMutation.mutateAsync({ reportId: Number(reportId), action: resolutionAction });
    } else {
      await dismissReportMutation.mutateAsync({ reportId: Number(reportId) });
    }

    // refresh
    await refetch();
    setSelectedReport(null);
    setShowDetailsModal(false);
    setResolutionAction('');
    setResolutionNotes('');
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

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'open': return 'bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black rounded-lg';
      case 'resolved': return 'bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black rounded-lg';
      case 'dismissed': return 'bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black rounded-lg';
      default: return 'bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black rounded-lg';
    }
  };

  const getReasonText = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: 'Spam',
      offensive: 'Offensive Content',
      harassment: 'Harassment',
      adult: 'Adult Content',
      other: 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const filteredReports = reports.filter(report => {
    if (filters.status && report.status !== filters.status) return false;
    if (filters.type && report.type !== filters.type) return false;
    if (filters.reason && report.reason !== filters.reason) return false;
    return true;
  });

  const openReportsCount = reports.filter(r => r.status === 'open').length;
  const resolvedReportsCount = reports.filter(r => r.status === 'resolved').length;
  const dismissedReportsCount = reports.filter(r => r.status === 'dismissed').length;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
      <AdminNav currentPath={location} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Moderation</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Review and manage user reports</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">!</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Open Reports</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{openReportsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resolved</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{resolvedReportsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">×</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dismissed</h3>
              <p className="text-2xl font-bold text-gray-600">{dismissedReportsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">Σ</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Reports</h3>
              <p className="text-2xl font-bold text-black dark:text-white">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="user">Users</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason
            </label>
            <select
              value={filters.reason}
              onChange={(e) => setFilters({...filters, reason: e.target.value})}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Reasons</option>
              <option value="spam">Spam</option>
              <option value="offensive">Offensive</option>
              <option value="harassment">Harassment</option>
              <option value="adult">Adult Content</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reported By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black dark:border-white capitalize">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {report.type === 'post' && report.targetTitle}
                      {report.type === 'comment' && (report.targetContent ? report.targetContent.substring(0, 50) + '...' : 'Comment')}
                      {report.type === 'user' && report.targetUsername}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getReasonText(report.reason)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {report.reportedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {report.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailsModal(true);
                        }}
                        className="text-black dark:text-white hover:underline font-bold"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No reports found</p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Report Details
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span className="ml-2 capitalize">{selectedReport.type}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Target:</span>
                  <div className="ml-2 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    {selectedReport.type === 'post' && selectedReport.targetTitle}
                    {selectedReport.type === 'comment' && selectedReport.targetContent}
                    {selectedReport.type === 'user' && selectedReport.targetUsername}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>
                  <span className="ml-2">{getReasonText(selectedReport.reason)}</span>
                </div>

                {selectedReport.description && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <div className="ml-2 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      {selectedReport.description}
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Reported by:</span>
                  <span className="ml-2">{selectedReport.reportedBy}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                  <span className="ml-2">{formatDate(selectedReport.createdAt)}</span>
                </div>
              </div>

              {selectedReport.status === 'open' && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Resolution</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Action
                      </label>
                      <select
                        value={resolutionAction}
                        onChange={(e) => setResolutionAction(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select action...</option>
                        <option value="delete_content">Delete Content</option>
                        <option value="ban_user">Ban User</option>
                        <option value="warn_user">Warn User</option>
                        <option value="hide_content">Hide Content</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Internal notes about this resolution..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      onClick={() => handleResolveReport(selectedReport.id, 'dismiss')}
                      className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg border-2 border-black"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => handleResolveReport(selectedReport.id, 'resolve')}
                      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg border-2 border-black"
                    >
                      Resolve Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}