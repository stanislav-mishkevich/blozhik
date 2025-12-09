import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';

interface User {
  id: number;
  openId: string;
  username: string | null;
  email: string | null;
  name: string | null;
  role: string;
  isBanned: number;
  banReason: string | null;
  bannedAt: string | null;
  bannedUntil: string | null;
  createdAt: string;
  lastSignedIn: string;
}

export default function AdminUsers() {
  const [location] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<{
    role: string;
    status: "active" | "banned" | "inactive" | "";
    search: string;
  }>({
    role: '',
    status: '',
    search: '',
  });

  const queryFilters = {
    ...filters,
    status: filters.status || undefined,
  };

  const { data: usersData, refetch } = trpc.admin.users.list.useQuery(queryFilters as any);
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation();
  const banMutation = trpc.admin.users.ban.useMutation();
  const unbanMutation = trpc.admin.users.unban.useMutation();
  const deleteMutation = trpc.admin.users.delete.useMutation();

  useEffect(() => {
    if (usersData) {
      setUsers(usersData.users);
    }
  }, [usersData]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      refetch();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleBan = async (userId: number) => {
    const reason = prompt('Ban reason:');
    if (reason !== null) {
      try {
        await banMutation.mutateAsync({ userId, reason: reason || undefined });
        refetch();
      } catch (error) {
        console.error('Failed to ban user:', error);
      }
    }
  };

  const handleUnban = async (userId: number) => {
    try {
      await unbanMutation.mutateAsync({ userId });
      refetch();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleDelete = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.username || user?.email || 'this user';
    
    if (!confirm(`Are you sure you want to delete ${userName}? This will permanently delete all their posts, comments, and other data. This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync({ userId });
      // Обновляем локальное состояние немедленно
      setUsers(users.filter(u => u.id !== userId));
      await refetch();
      alert(`User ${userName} deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(`Failed to delete user ${userName}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AdminHeader title="User Management" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="user-role-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select
              id="user-role-filter"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="mt-1 block w-full rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">SuperAdmin</option>
              <option value="god">God</option>
            </select>
          </div>
          <div>
            <label htmlFor="user-status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              id="user-status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as typeof filters.status })}
              className="mt-1 block w-full rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
            <input
              id="user-search"
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by username, email, or name"
              className="mt-1 block w-full rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-black sketch-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username || user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-sm rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">SuperAdmin</option>
                      <option value="god">God</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isBanned
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>User stats</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBan(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-4"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
        </main>
      </div>
    </AdminHeader>
  );
}