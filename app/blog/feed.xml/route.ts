import { BLOG_POSTS } from "@/lib/blog-data";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://huevsite.io';

  const feedContext = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog - huevsite.io</title>
    <link>${siteUrl}/blog</link>
    <description>Noticias, guías y casos de estudio de la comunidad de huevsite.io para empoderar a creadores y builders.</description>
    <language>es-ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${BLOG_POSTS.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${siteUrl}/blog/${post.slug}</link>
        <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description><![CDATA[${post.excerpt}]]></description>
        <author>${post.author.name}</author>
        ${post.tags.map(tag => `<category>${tag}</category>`).join('')}
      </item>
    `).join('')}
  </channel>
</rss>`;

  return new Response(feedContext, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
