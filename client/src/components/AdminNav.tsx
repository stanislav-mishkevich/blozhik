import { useLocation } from 'wouter';
import { useAuthState } from '@/hooks/useAuthState';
import { 
  LayoutDashboard,
  Users, 
  FileText, 
  MessageCircle, 
  Flag, 
  Ban, 
  Shield, 
  BarChart3, 
  History,
  Settings as SettingsIcon,
  Megaphone,
  Activity
} from 'lucide-react';
import type { Role } from '@/../../shared/rolePermissions';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  minRole: Role; // минимальная роль для доступа
}

// Распределение доступа по ролям:
// - Moderator: контент-модерация (посты, комментарии, репорты, статистика)
// - Admin: + управление пользователями, баны, роли, объявления, настройки
// - SuperAdmin: + логи активности и аудита
// - God: все вкладки без исключений
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin', minRole: 'moderator' },
  { id: 'users', label: 'User Management', icon: Users, path: '/admin/users', minRole: 'admin' },
  { id: 'content', label: 'Content Management', icon: FileText, path: '/admin/posts', minRole: 'moderator' },
  { id: 'comments', label: 'Comments', icon: MessageCircle, path: '/admin/comments', minRole: 'moderator' },
  { id: 'reports', label: 'Reports & Moderation', icon: Flag, path: '/admin/reports', minRole: 'moderator' },
  { id: 'bans', label: 'Ban Management', icon: Ban, path: '/admin/bans', minRole: 'admin' },
  { id: 'roles', label: 'Role Management', icon: Shield, path: '/admin/roles', minRole: 'admin' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/admin/announcements', minRole: 'admin' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, path: '/admin/statistics', minRole: 'moderator' },
  { id: 'activity', label: 'Activity Logs', icon: Activity, path: '/admin/activity-logs', minRole: 'superadmin' },
  { id: 'audit', label: 'Audit Logs', icon: History, path: '/admin/audit-logs', minRole: 'superadmin' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/admin/settings', minRole: 'admin' },
];

// Иерархия ролей для проверки доступа
const ROLE_HIERARCHY: Record<Role, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
  god: 4
};

interface AdminNavProps {
  currentPath?: string;
}

export default function AdminNav({ currentPath }: AdminNavProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuthState();
  const activePath = currentPath || location;

  // Проверка доступа по роли
  const hasAccess = (minRole: Role): boolean => {
    if (!user?.role) return false;
    const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
    return userLevel >= minLevel;
  };

  // Фильтруем пункты меню по правам доступа
  const accessibleItems = NAV_ITEMS.filter(item => hasAccess(item.minRole));

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r-2 border-black dark:border-white">
      <div className="p-4">
        {/* Индикатор роли */}
        <div className="mb-4 px-4 py-3 bg-black dark:bg-white rounded-lg border-2 border-black dark:border-white">
          <p className="text-xs font-bold text-white dark:text-black uppercase tracking-wider">Role</p>
          <p className="text-sm font-black text-white dark:text-black mt-0.5">{user?.role || 'Unknown'}</p>
        </div>

        <nav className="space-y-1">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-white dark:bg-gray-900 text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
