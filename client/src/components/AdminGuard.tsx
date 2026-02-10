import React from 'react';
import AdminHeader from './AdminHeader';
import ErrorPage from './ErrorPage';
import { useAuthState } from '@/hooks/useAuthState';

interface Props {
  minRole?: 'user' | 'moderator' | 'admin' | 'superadmin' | 'god';
  children: React.ReactNode;
}

function roleLevel(role: string | undefined) {
  const levels: Record<string, number> = { user: 0, moderator: 1, admin: 2, superadmin: 3, god: 4 };
  return levels[role || 'user'] || 0;
}

export default function AdminGuard({ minRole = 'moderator', children }: Props) {
  const { user, isAuthenticated, loading } = useAuthState();

  if (loading) {
    return (
      <AdminHeader title="Loading...">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p>Loading...</p>
        </div>
      </AdminHeader>
    );
  }

  if (!isAuthenticated || roleLevel(user?.role) < roleLevel(minRole)) {
    // Показываем уже существующую декоративную заглушку с GIF и шуткой
    return <ErrorPage code={403} title="Access Denied" message="You don't have permission to access this admin area." />;
  }

  return <>{children}</>;
}
