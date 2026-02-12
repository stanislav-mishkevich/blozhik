import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { generateRSSFeed } from "./rss";
import * as db from "../db";
import { ENV } from "./env";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  rss: publicProcedure
    .query(async () => {
      const feed = await generateRSSFeed();
      return { feed };
    }),

  sitemap: publicProcedure
    .query(async () => {
      const baseUrl = ENV.baseUrl;
      const posts = await db.getPublishedPosts({ limit: 1000, offset: 0 });
      const usersData = await db.getUsers({ limit: 1000 });
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Homepage
      xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Feed pages
      xml += `  <url>\n    <loc>${baseUrl}/feed</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      
      // Posts
      for (const item of posts) {
        const post = item.post;
        const lastmod = new Date(post.createdAt).toISOString().split('T')[0];
        xml += `  <url>\n    <loc>${baseUrl}/posts/${post.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
      
      // User profiles
      for (const user of usersData.users) {
        xml += `  <url>\n    <loc>${baseUrl}/users/${user.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      }
      
      xml += '</urlset>';
      return { sitemap: xml };
    }),

  robots: publicProcedure
    .query(() => {
      const baseUrl = ENV.baseUrl;
      let txt = 'User-agent: *\n';
      txt += 'Allow: /\n';
      txt += 'Disallow: /admin\n';
      txt += 'Disallow: /settings\n';
      txt += 'Disallow: /write\n';
      txt += 'Disallow: /drafts\n';
      txt += '\n';
      txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
      return { robots: txt };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
