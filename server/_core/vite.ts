import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Resolve viteConfig - it may be a function or an object
  const resolvedConfig = typeof viteConfig === 'function' 
    ? viteConfig({ mode: process.env.NODE_ENV || 'development', command: 'serve', ssrBuild: false, isSsrBuild: false, isPreview: false })
    : viteConfig;

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Use vite.middlewares at the root so it can serve assets and HMR paths correctly.
  app.use(vite.middlewares);

  // Only handle SPA index requests under the configured base path. Static asset
  // requests (e.g., /blozhik/assets/*, /blozhik/@vite/*, files with extensions)
  // should be handled by the vite middleware above.
  const base = (resolvedConfig?.base || "/").replace(/\/$/, "");
  const mountPath = base === "" ? "/" : base;

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl || "/";

    // If request is outside the base path, skip (could be API or other server routes)
    if (mountPath !== "/" && !url.startsWith(mountPath)) {
      return next();
    }

    // If the request targets typical static asset paths or contains a file extension,
    // let the vite middleware handle it instead of serving index.html.
    const assetPrefixes = ["/assets/", "/@vite/", "/src/", "/node_modules/"];
    const pathWithinBase = mountPath === "/" ? url : url.replace(new RegExp(`^${mountPath}`), "") || "/";
    const lower = pathWithinBase.toLowerCase();

    const hasAssetPrefix = assetPrefixes.some(p => lower.startsWith(p));
    const hasFileExt = /\.[a-z0-9]{1,6}(?:\?|$)/i.test(pathWithinBase);

    if (hasAssetPrefix || hasFileExt) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Pass the URL relative to the base to Vite so imports are resolved correctly.
      const relativeUrl = pathWithinBase || "/";
      const page = await vite.transformIndexHtml(relativeUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // In production, serve static files with the base path
  const basePath = process.env.BASE_PATH || '/blozhik';
  app.use(basePath, express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
