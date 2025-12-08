import type { Request, Response, NextFunction } from "express";
import { PERMISSIONS, ROLES, type Permission, type Role, userHasPermission } from "../../../shared/permissions.js";

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: Role;
        permissions: Permission[];
      };
    }
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const roleHierarchy = [ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.GOD];
    const userRoleIndex = roleHierarchy.indexOf(req.user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!userHasPermission(req.user.role, req.user.permissions, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware to check if user is not banned
 */
export function checkNotBanned(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  // This would need to be checked against the database
  // For now, assume user is attached with ban status
  if ((req.user as any).isBanned) {
    return res.status(403).json({ error: "Account is banned" });
  }

  next();
}

/**
 * Admin panel session timeout middleware
 */
export function adminSessionTimeout(req: Request, res: Response, next: NextFunction) {
  // Check if this is an admin route
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/admin')) {
    // In a real implementation, check session timestamp
    // For now, just pass through
  }
  next();
}