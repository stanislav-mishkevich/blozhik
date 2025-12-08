/**
 * Permission definitions for BLOZHIK admin system
 */

export const PERMISSIONS = {
  // User permissions
  CREATE_OWN_POSTS: 'create_own_posts',
  EDIT_OWN_POSTS: 'edit_own_posts',
  DELETE_OWN_POSTS: 'delete_own_posts',
  COMMENT_ON_POSTS: 'comment_on_posts',
  LIKE_POSTS: 'like_posts',
  VIEW_OWN_PROFILE: 'view_own_profile',
  EDIT_OWN_PROFILE: 'edit_own_profile',

  // Admin permissions
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_ALL_POSTS: 'view_all_posts',
  DELETE_ANY_POST: 'delete_any_post',
  DELETE_ANY_COMMENT: 'delete_any_comment',
  VIEW_REPORTS: 'view_reports',
  RESOLVE_REPORTS: 'resolve_reports',
  SOFT_BAN_USERS: 'soft_ban_users',
  VIEW_BASIC_STATISTICS: 'view_basic_statistics',
  VIEW_AUDIT_LOGS_OWN: 'view_audit_logs_own',

  // SuperAdmin permissions
  HARD_BAN_USERS: 'hard_ban_users',
  DELETE_USER_ACCOUNTS: 'delete_user_accounts',
  EDIT_USER_ROLES: 'edit_user_roles',
  VIEW_FULL_STATISTICS: 'view_full_statistics',
  ACCESS_ALL_REPORTS: 'access_all_reports',
  CREATE_ANNOUNCEMENTS: 'create_announcements',
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_ALL_AUDIT_LOGS: 'view_all_audit_logs',

  // God permissions
  EDIT_ANY_USER_ROLE: 'edit_any_user_role',
  VIEW_EDIT_SYSTEM_CONFIG: 'view_edit_system_config',
  DATABASE_OPERATIONS: 'database_operations',
  ACCESS_GOD_PANEL: 'access_god_panel',
  MANAGE_BACKUP_RESTORE: 'manage_backup_restore',
  VIEW_COMPLETE_AUDIT_TRAIL: 'view_complete_audit_trail',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  GOD: 'god',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Default permissions for each role
 */
const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.CREATE_OWN_POSTS,
  PERMISSIONS.EDIT_OWN_POSTS,
  PERMISSIONS.DELETE_OWN_POSTS,
  PERMISSIONS.COMMENT_ON_POSTS,
  PERMISSIONS.LIKE_POSTS,
  PERMISSIONS.VIEW_OWN_PROFILE,
  PERMISSIONS.EDIT_OWN_PROFILE,
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.VIEW_ALL_POSTS,
  PERMISSIONS.DELETE_ANY_POST,
  PERMISSIONS.DELETE_ANY_COMMENT,
  PERMISSIONS.VIEW_REPORTS,
  PERMISSIONS.RESOLVE_REPORTS,
  PERMISSIONS.VIEW_BASIC_STATISTICS,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  PERMISSIONS.VIEW_ALL_USERS,
  PERMISSIONS.SOFT_BAN_USERS,
  PERMISSIONS.VIEW_AUDIT_LOGS_OWN,
];

const SUPERADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.HARD_BAN_USERS,
  PERMISSIONS.DELETE_USER_ACCOUNTS,
  PERMISSIONS.EDIT_USER_ROLES,
  PERMISSIONS.VIEW_FULL_STATISTICS,
  PERMISSIONS.ACCESS_ALL_REPORTS,
  PERMISSIONS.CREATE_ANNOUNCEMENTS,
  PERMISSIONS.MANAGE_CATEGORIES,
  PERMISSIONS.VIEW_ALL_AUDIT_LOGS,
];

const GOD_PERMISSIONS: Permission[] = [
  ...SUPERADMIN_PERMISSIONS,
  PERMISSIONS.EDIT_ANY_USER_ROLE,
  PERMISSIONS.VIEW_EDIT_SYSTEM_CONFIG,
  PERMISSIONS.DATABASE_OPERATIONS,
  PERMISSIONS.ACCESS_GOD_PANEL,
  PERMISSIONS.MANAGE_BACKUP_RESTORE,
  PERMISSIONS.VIEW_COMPLETE_AUDIT_TRAIL,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.SUPERADMIN]: SUPERADMIN_PERMISSIONS,
  [ROLES.GOD]: GOD_PERMISSIONS,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has a specific permission (considering custom user permissions)
 */
export function userHasPermission(userRole: Role, userPermissions: Permission[], permission: Permission): boolean {
  // Check role permissions
  if (hasPermission(userRole, permission)) {
    return true;
  }
  // Check custom user permissions
  return userPermissions.includes(permission);
}