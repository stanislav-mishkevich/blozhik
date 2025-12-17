import "dotenv/config";
// Enforce minimum Node.js version to avoid runtime errors (e.g., Vite uses crypto.hash on Node 20+)
const [major, minor, patch] = process.versions.node.split('.').map(Number);
const MIN_MAJOR = 20;
const MIN_MINOR = 19;
if (major < MIN_MAJOR || (major === MIN_MAJOR && minor < MIN_MINOR)) {
  console.error(`\nERROR: Unsupported Node.js version ${process.versions.node}.`);
  console.error(`This project requires Node.js >= ${MIN_MAJOR}.${MIN_MINOR}.0 (recommended: Node 20.19+).`);
  console.error("Please upgrade your Node.js version (nvm, volta, or Homebrew can be used).");
  console.error("Example with nvm: nvm install 20 && nvm use 20\n");
  process.exit(1);
}
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import * as db from '../db';
import { subscribe as subscribeNotifications, unsubscribe as unsubscribeNotifications } from './notificationHub';
import { serveStatic, setupVite } from "./vite";
import guardMalformedUri from "./middleware/guardMalformedUri";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3030): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  
  // CORS - allow requests from the frontend
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }));
  
  // Security headers
  app.use((req, res, next) => {
    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME-sniffing attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    next();
  });
  
  // Disable X-Powered-By header globally
  app.disable('x-powered-by');
  
  // Guard against malformed URI sequences in request paths.
  app.use(guardMalformedUri);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // SSE endpoint for notifications
  app.get('/api/notifications/stream', async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) return res.status(401).end();

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const userId = ctx.user.id as number;
      const listener = { id: Date.now().toString(), res } as any;
      subscribeNotifications(userId, listener);

      req.on('close', () => {
        if (userId) unsubscribeNotifications(userId, listener);
      });
    } catch (err) {
      console.warn('[SSE] Error setting up stream', err);
      res.status(500).end();
    }
  });

  // SEO endpoints
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const result = await appRouter.createCaller(await createContext({ req, res } as any)).system.sitemap();
      res.setHeader('Content-Type', 'application/xml');
      res.send(result.sitemap);
    } catch (err) {
      console.error('[Sitemap] Error generating sitemap', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', async (req, res) => {
    try {
      const result = await appRouter.createCaller(await createContext({ req, res } as any)).system.robots();
      res.setHeader('Content-Type', 'text/plain');
      res.send(result.robots);
    } catch (err) {
      console.error('[Robots] Error generating robots.txt', err);
      res.status(500).send('Error generating robots.txt');
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3030");
  let port: number;
  // If PORT is explicitly provided in environment, refuse to fallback to a different port
  if (process.env.PORT) {
    if (!(await isPortAvailable(preferredPort))) {
      console.error(`Port ${preferredPort} is busy, please free the port or set a different PORT in your environment.`);
      process.exit(1);
    }
    port = preferredPort;
  } else {
    port = await findAvailablePort(preferredPort);
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Scheduler: publish scheduled posts every 60 seconds
  setInterval(async () => {
    try {
      const published = await db.publishScheduledPosts();
      if (published.length > 0) console.log('[Scheduler] Published scheduled posts:', published.join(','));
    } catch (err) {
      console.warn('[Scheduler] Error publishing scheduled posts', err);
    }
  }, 60 * 1000);
}

startServer().catch(console.error);
