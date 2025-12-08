import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../../../shared/permissions';
import AdminHeader from '../components/AdminHeader';
import AdminNav from '../components/AdminNav';
import { useLocation } from 'wouter';

export default function AdminRoles() {
  const [location] = useLocation();
  const [roles, setRoles] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  // Mock data for now - in real implementation, fetch from API
  useEffect(() => {
    const initialRoles = Object.values(ROLES).map(role => ({
      name: role,
      permissions: ROLE_PERMISSIONS[role] || [],
    }));
    setRoles(initialRoles);
    setRolePermissions(Object.fromEntries(
      Object.values(ROLES).map(role => [role, ROLE_PERMISSIONS[role] || []])
    ));
  }, []);

  const handlePermissionToggle = (role: string, permission: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: prev[role]?.includes(permission)
        ? prev[role].filter(p => p !== permission)
        : [...(prev[role] || []), permission]
    }));
  };

  const handleSavePermissions = async (role: string) => {
    // TODO: Save to API
    console.log('Saving permissions for role:', role, rolePermissions[role]);
    setEditingRole(null);
  };

  const allPermissions = Object.values(PERMISSIONS);

  return (
    <AdminHeader title="Role Management" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400">Manage user roles and their permissions</p>
      </div>

      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role.name} className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-black dark:text-white capitalize">
                  {role.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                  {role.permissions.length} permissions assigned
                </p>
              </div>
              <div className="flex space-x-2">
                {editingRole === role.name ? (
                  <>
                    <button
                      onClick={() => handleSavePermissions(role.name)}
                      className="bg-black text-white px-3 py-1 rounded-lg border-2 border-black text-sm hover:bg-gray-800"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRole(null)}
                      className="bg-white text-black px-3 py-1 rounded-lg border-2 border-black text-sm hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingRole(role.name)}
                    className="bg-black text-white px-3 py-1 rounded-lg border-2 border-black text-sm hover:bg-gray-800"
                  >
                    Edit Permissions
                  </button>
                )}
              </div>
            </div>

            {editingRole === role.name ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPermissions.map((permission) => (
                  <label key={permission} className="flex items-center space-x-2 font-bold">
                    <input
                      type="checkbox"
                      checked={rolePermissions[role.name]?.includes(permission) || false}
                      onChange={() => handlePermissionToggle(role.name, permission)}
                      className="border-2 border-black dark:border-white w-5 h-5"
                    />
                    <span className="text-sm text-black dark:text-white font-bold">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission: string) => (
                  <span
                    key={permission}
                    className="inline-flex items-center px-2.5 py-0.5 border-2 border-black dark:border-white rounded-lg text-xs font-black bg-white dark:bg-gray-900 text-black dark:text-white"
                  >
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div className="mt-8 bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-6 sketch-shadow">
        <h2 className="text-lg font-black text-black dark:text-white mb-4">Permission Matrix</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-black dark:divide-white">
            <thead className="bg-black dark:bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-white dark:text-black uppercase tracking-wider">
                  Permission
                </th>
                {Object.values(ROLES).map(role => (
                  <th key={role} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allPermissions.map((permission, index) => (
                <tr key={permission} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  {Object.values(ROLES).map(role => (
                    <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                      {rolePermissions[role]?.includes(permission) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white text-black dark:bg-gray-900 dark:text-white border-2 border-black dark:border-white">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          ✗
                        </span>
                      )}
                    </td>
                  ))}
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