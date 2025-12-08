// Comprehensive audit logging system
// Logs all user actions, errors, and system events

import { auditLogs } from '../../drizzle/schema';
import { getDb } from '../db';

export type AuditAction = 
  // User actions
  | 'user_login' | 'user_logout' | 'user_register' | 'user_profile_update'
  // Post actions  
  | 'post_created' | 'post_updated' | 'post_deleted' | 'post_published' | 'post_unpublished'
  | 'post_featured' | 'post_unfeatured' | 'post_viewed'
  // Comment actions
  | 'comment_created' | 'comment_updated' | 'comment_deleted'
  // Reaction actions
  | 'like_added' | 'like_removed' | 'reaction_added' | 'reaction_removed'
  // Social actions
  | 'user_followed' | 'user_unfollowed' | 'bookmark_added' | 'bookmark_removed'
  // Admin actions
  | 'user_banned' | 'user_unbanned' | 'user_role_changed' | 'user_created_by_admin' | 'user_deleted'
  | 'announcement_created' | 'announcement_updated' | 'announcement_deleted'
  | 'report_created' | 'report_resolved' | 'report_dismissed'
  // System events
  | 'error_occurred' | 'api_request' | 'unauthorized_access' | 'validation_error'
  | 'database_error' | 'external_api_error';

export interface AuditLogData {
  action: AuditAction;
  userId?: number | null; // User who performed action (null for system/unauthenticated)
  targetType?: 'user' | 'post' | 'comment' | 'report' | 'announcement' | 'system' | null;
  targetId?: number | null;
  details?: Record<string, any>; // Additional context
  ipAddress?: string | null;
  userAgent?: string | null;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Log user action to audit log
 */
export async function logAction(data: AuditLogData): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[AuditLog] Database not available');
    return;
  }

  try {
    const logEntry = {
      action: data.action,
      userId: data.userId ?? null,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      details: JSON.stringify({
        ...data.details,
        error: data.error,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    };

    await db.insert(auditLogs).values(logEntry);

    // Log to console for debugging
    console.log(`[AuditLog] ${data.action}`, {
      user: data.userId,
      target: data.targetType ? `${data.targetType}:${data.targetId}` : undefined,
      details: data.details,
    });
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
    // Don't throw - audit log failure shouldn't break the main operation
  }
}

/**
 * Log error
 */
export async function logError(error: Error, context?: {
  userId?: number;
  action?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAction({
    action: 'error_occurred',
    userId: context?.userId,
    targetType: 'system',
    details: {
      ...context?.details,
      originalAction: context?.action,
    },
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    error: {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    },
  });
}

/**
 * Log API request
 */
export async function logApiRequest(data: {
  method: string;
  path: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  duration?: number;
}): Promise<void> {
  await logAction({
    action: 'api_request',
    userId: data.userId,
    targetType: 'system',
    details: {
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      duration: data.duration,
    },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorized(data: {
  userId?: number;
  path: string;
  requiredRole?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAction({
    action: 'unauthorized_access',
    userId: data.userId,
    targetType: 'system',
    details: {
      path: data.path,
      requiredRole: data.requiredRole,
    },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}
