import { useState } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Clock, Ban, UserX } from 'lucide-react';

export default function AdminBans() {
  const [location] = useLocation();
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [banForm, setBanForm] = useState({
    userId: 0,
    reason: '',
    days: '',
    isPermanent: false,
  });

  // Fetch active bans
  const { data: bans = [], refetch } = trpc.admin.bans.list.useQuery();
  const { data: users = [] } = trpc.admin.users.list.useQuery({ limit: 1000 });
  
  // Mutations
  const banMutation = trpc.admin.bans.ban.useMutation({
    onSuccess: () => {
      toast.success('User banned successfully');
      refetch();
      setShowBanModal(false);
      setBanForm({ userId: 0, reason: '', days: '', isPermanent: false });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const unbanMutation = trpc.admin.bans.unban.useMutation({
    onSuccess: () => {
      toast.success('User unbanned successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleUnban = async (userId: number, username: string) => {
    if (confirm(`Unban user ${username}?`)) {
      unbanMutation.mutate({ userId });
    }
  };

  const handleBanUser = async () => {
    if (!banForm.userId || !banForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    banMutation.mutate({
      userId: banForm.userId,
      reason: banForm.reason,
      days: banForm.isPermanent ? undefined : parseInt(banForm.days),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBanDurationText = (ban: any) => {
    if (!ban.bannedUntil) return 'Permanent';
    const endDate = new Date(ban.bannedUntil);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return `${daysLeft} days (until ${endDate.toLocaleDateString('en-US')})`;
  };

  return (
    <AdminHeader title="Ban Management" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-gray-600">Manage bans and user blocks</p>
            </div>
            <button
              onClick={() => setShowBanModal(true)}
              className="bg-black text-white px-6 py-3 rounded-lg border-2 border-black hover:bg-gray-800"
            >
              <Ban className="mr-2 inline h-5 w-5" />
              Ban User
            </button>
          </div>

          {/* Ban Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center">
                <UserX className="h-10 w-10 text-black dark:text-white" />
                <div className="ml-4">
                  <h3 className="font-bold text-gray-600 dark:text-gray-400">Active Bans</h3>
                  <p className="text-3xl font-black text-black dark:text-white">{bans.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center">
                <Clock className="h-10 w-10 text-black dark:text-white" />
                <div className="ml-4">
                  <h3 className="font-bold text-gray-600 dark:text-gray-400">Temporary</h3>
                  <p className="text-3xl font-black text-black dark:text-white">{bans.filter(b => b.bannedUntil).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6 sketch-shadow">
              <div className="flex items-center">
                <Ban className="h-10 w-10 text-black dark:text-white" />
                <div className="ml-4">
                  <h3 className="font-bold text-gray-600 dark:text-gray-400">Permanent</h3>
                  <p className="text-3xl font-black text-black dark:text-white">{bans.filter(b => !b.bannedUntil).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bans Table */}
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg sketch-shadow overflow-hidden">
            <div className="border-b-2 border-black dark:border-white bg-slate-50 dark:bg-slate-800 px-6 py-4">
              <h2 className="font-bold text-lg text-black dark:text-white">Ban List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="border-r-2 border-black px-6 py-3 text-left font-black uppercase">
                      User
                    </th>
                    <th className="border-r-2 border-black px-6 py-3 text-left font-black uppercase">
                      Reason
                    </th>
                    <th className="border-r-2 border-black px-6 py-3 text-left font-black uppercase">
                      Duration
                    </th>
                    <th className="border-r-2 border-black px-6 py-3 text-left font-black uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left font-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <p className="font-bold text-gray-400">No active bans</p>
                      </td>
                    </tr>
                  ) : (
                    bans.map((ban) => (
                      <tr key={ban.userId} className="border-t-2 border-black">
                        <td className="border-r-2 border-black px-6 py-4">
                          <div className="font-bold">{ban.username}</div>
                          <div className="text-sm text-gray-600">{ban.email}</div>
                        </td>
                        <td className="border-r-2 border-black px-6 py-4">
                          <div className="font-mono text-sm">{ban.banReason}</div>
                        </td>
                        <td className="border-r-2 border-black px-6 py-4">
                          <div className="font-bold">{getBanDurationText(ban)}</div>
                        </td>
                        <td className="border-r-2 border-black px-6 py-4">
                          <div className="text-sm">{formatDate(ban.bannedAt!)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUnban(ban.userId, ban.username!)}
                            className="border-2 border-black bg-black text-white px-4 py-2 font-bold rounded-lg hover:bg-gray-800"
                          >
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ban User Modal */}
          {showBanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="mx-4 w-full max-w-md border-2 border-black dark:border-white bg-white dark:bg-gray-900 rounded-lg p-6 sketch-shadow">
                <h3 className="mb-6 border-b-2 border-black dark:border-white pb-3 text-2xl font-bold">
                  Ban User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ban-user" className="mb-2 block font-bold uppercase">User</label>
                    <select
                      id="ban-user"
                      value={banForm.userId}
                      onChange={(e) => setBanForm({ ...banForm, userId: parseInt(e.target.value) })}
                      className="w-full border-2 border-black dark:border-white rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-900"
                    >
                      <option value={0}>Select user...</option>
                      {(Array.isArray(users) ? users : users.users || []).map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ban-reason" className="mb-2 block font-bold uppercase">Reason</label>
                    <textarea
                      id="ban-reason"
                      value={banForm.reason}
                      onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                      className="w-full border-2 border-black dark:border-white rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-900"
                      rows={3}
                      placeholder="Specify ban reason..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="permanent"
                      checked={banForm.isPermanent}
                      onChange={(e) => setBanForm({ ...banForm, isPermanent: e.target.checked })}
                      className="h-5 w-5 border-2 border-black rounded"
                    />
                    <label htmlFor="permanent" className="font-bold">
                      Permanent Ban
                    </label>
                  </div>
                  {!banForm.isPermanent && (
                    <div>
                      <label htmlFor="ban-duration" className="mb-2 block font-bold uppercase">Duration (days)</label>
                      <input
                        id="ban-duration"
                        type="number"
                        value={banForm.days}
                        onChange={(e) => setBanForm({ ...banForm, days: e.target.value })}
                        className="w-full border-2 border-black dark:border-white rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-900"
                        placeholder="7"
                        min="1"
                      />
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        Common: 1 day, 3 days, 7 days, 14 days, 30 days
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowBanModal(false);
                      setBanForm({ userId: 0, reason: '', days: '', isPermanent: false });
                    }}
                    className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white px-6 py-3 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBanUser}
                    disabled={banMutation.isPending}
                    className="border-2 border-black bg-black text-white px-6 py-3 font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {banMutation.isPending ? 'Banning...' : 'Ban'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}

