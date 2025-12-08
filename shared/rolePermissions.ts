/**
 * Права доступа для ролей в системе
 */

export type Role = 'user' | 'moderator' | 'admin' | 'superadmin' | 'god';

export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  userManagement: Permission;
  contentManagement: Permission;
  comments: Permission;
  reportsModeration: Permission;
  banManagement: Permission;
  roleManagement: Permission;
  statistics: Permission;
  auditLogs: Permission;
  settings: Permission;
}

/**
 * Определение прав для каждой роли
 */
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  user: {
    userManagement: { read: false, create: false, update: false, delete: false },
    contentManagement: { read: true, create: true, update: true, delete: true }, // только свои посты
    comments: { read: true, create: true, update: true, delete: true }, // только свои комментарии
    reportsModeration: { read: false, create: true, update: false, delete: false }, // может создавать жалобы
    banManagement: { read: false, create: false, update: false, delete: false },
    roleManagement: { read: false, create: false, update: false, delete: false },
    statistics: { read: false, create: false, update: false, delete: false },
    auditLogs: { read: false, create: false, update: false, delete: false },
    settings: { read: false, create: false, update: false, delete: false },
  },

  moderator: {
    userManagement: { read: true, create: false, update: false, delete: false }, // просмотр пользователей
    contentManagement: { read: true, create: false, update: true, delete: true }, // модерация постов
    comments: { read: true, create: true, update: true, delete: true }, // модерация комментариев
    reportsModeration: { read: true, create: true, update: true, delete: false }, // работа с жалобами
    banManagement: { read: true, create: false, update: false, delete: false }, // просмотр банов
    roleManagement: { read: false, create: false, update: false, delete: false },
    statistics: { read: true, create: false, update: false, delete: false }, // базовая статистика
    auditLogs: { read: false, create: false, update: false, delete: false },
    settings: { read: false, create: false, update: false, delete: false },
  },

  admin: {
    userManagement: { read: true, create: false, update: true, delete: false }, // управление пользователями
    contentManagement: { read: true, create: true, update: true, delete: true }, // полный доступ к контенту
    comments: { read: true, create: true, update: true, delete: true }, // полный доступ к комментариям
    reportsModeration: { read: true, create: true, update: true, delete: true }, // полная модерация
    banManagement: { read: true, create: true, update: true, delete: true }, // управление банами
    roleManagement: { read: true, create: false, update: false, delete: false }, // просмотр ролей
    statistics: { read: true, create: false, update: false, delete: false }, // полная статистика
    auditLogs: { read: false, create: false, update: false, delete: false },
    settings: { read: true, create: false, update: false, delete: false }, // просмотр настроек
  },

  superadmin: {
    userManagement: { read: true, create: true, update: true, delete: true }, // полное управление пользователями
    contentManagement: { read: true, create: true, update: true, delete: true }, // полный доступ
    comments: { read: true, create: true, update: true, delete: true }, // полный доступ
    reportsModeration: { read: true, create: true, update: true, delete: true }, // полный доступ
    banManagement: { read: true, create: true, update: true, delete: true }, // полный доступ
    roleManagement: { read: true, create: false, update: true, delete: false }, // назначение до admin
    statistics: { read: true, create: false, update: false, delete: false }, // полная статистика
    auditLogs: { read: true, create: false, update: false, delete: false }, // просмотр аудита
    settings: { read: true, create: false, update: true, delete: false }, // управление настройками
  },

  god: {
    userManagement: { read: true, create: true, update: true, delete: true }, // полный доступ
    contentManagement: { read: true, create: true, update: true, delete: true }, // полный доступ
    comments: { read: true, create: true, update: true, delete: true }, // полный доступ
    reportsModeration: { read: true, create: true, update: true, delete: true }, // полный доступ
    banManagement: { read: true, create: true, update: true, delete: true }, // полный доступ
    roleManagement: { read: true, create: true, update: true, delete: true }, // назначение любых ролей
    statistics: { read: true, create: true, update: true, delete: true }, // полный доступ
    auditLogs: { read: true, create: false, update: false, delete: true }, // управление аудитом
    settings: { read: true, create: true, update: true, delete: true }, // полный доступ к настройкам
  },
};

/**
 * Проверка права доступа для роли
 */
export function hasPermission(
  role: Role | undefined,
  section: keyof RolePermissions,
  action: keyof Permission
): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  return ROLE_PERMISSIONS[role][section][action];
}

/**
 * Проверка минимального уровня роли
 */
export function hasMinimumRole(userRole: Role | undefined, minimumRole: Role): boolean {
  const roleHierarchy: Role[] = ['user', 'moderator', 'admin', 'superadmin', 'god'];
  
  if (!userRole) return false;
  
  const userLevel = roleHierarchy.indexOf(userRole);
  const minLevel = roleHierarchy.indexOf(minimumRole);
  
  return userLevel >= minLevel;
}

/**
 * Может ли роль назначать другую роль
 */
export function canAssignRole(assignerRole: Role | undefined, targetRole: Role): boolean {
  if (!assignerRole) return false;
  
  if (assignerRole === 'god') return true;
  
  if (assignerRole === 'superadmin') {
    return ['user', 'moderator', 'admin'].includes(targetRole);
  }
  
  return false;
}
