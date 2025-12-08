import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logAction, logError, logUnauthorized } from './auditLog';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

// Logging middleware - logs all requests
const loggingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log successful request
    if (type === 'mutation') {
      console.log(`[tRPC] ${type} ${path} - ${duration}ms - user: ${ctx.user?.id || 'anonymous'}`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log error
    console.error(`[tRPC] ERROR ${type} ${path} - ${duration}ms - user: ${ctx.user?.id || 'anonymous'}`, error);
    
    if (error instanceof Error) {
      await logError(error, {
        userId: ctx.user?.id,
        action: `${type}:${path}`,
        details: {
          type,
          path,
          duration,
        },
      });
    }
    
    throw error;
  }
});

export const publicProcedure = t.procedure.use(loggingMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    await logUnauthorized({
      userId: undefined,
      path: opts.path,
    });
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Check ban status
  const { checkUserBanStatus } = await import('../db');
  const banStatus = await checkUserBanStatus(ctx.user.id);
  
  if (banStatus.isBanned) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "BANNED",
      cause: banStatus,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(loggingMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(loggingMiddleware).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const adminRoles = ['admin', 'moderator', 'superadmin', 'god'];
    if (!ctx.user || !adminRoles.includes(ctx.user.role || '')) {
      await logUnauthorized({
        userId: ctx.user?.id,
        path: opts.path,
        requiredRole: 'admin',
      });
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
