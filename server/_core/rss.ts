import * as db from '../db';

export async function generateRSSFeed(): Promise<string> {
  const posts = await db.getPublishedPosts({ limit: 50, offset: 0, sortBy: 'new' });
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const now = new Date().toUTCString();
  
  const items = await Promise.all(posts.map(async (item) => {
    const tags = await db.getPostTags(item.post.id);
    const categories = tags.map(t => `    <category>${escapeXml(t.tag.name)}</category>`).join('\n');
    
    return `  <item>
    <title>${escapeXml(item.post.title)}</title>
    <link>${baseUrl}/posts/${item.post.id}</link>
    <guid>${baseUrl}/posts/${item.post.id}</guid>
    <pubDate>${new Date(item.post.createdAt).toUTCString()}</pubDate>
    <author>${escapeXml(item.author.email || '')}</author>
    <description>${escapeXml(item.post.excerpt || item.post.content.substring(0, 200))}</description>
${categories}
  </item>`;
  }));
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blozhik</title>
    <link>${baseUrl}</link>
    <description>Modern blogging platform</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;

  return rss;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
