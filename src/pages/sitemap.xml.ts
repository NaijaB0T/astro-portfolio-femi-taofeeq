import type { APIRoute } from 'astro';
import { getPortfolioData } from '../lib/data';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    const baseUrl = 'https://femitaofeeq.com';
    
    // Get all active (non-archived) content
    const activeBlogPosts = data.blogPosts.filter(post => !post.archived);
    const activeWorks = data.works.filter(work => !work.archived);
    
    // Static pages with priorities and update frequencies
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'weekly' },
      { url: '/about', priority: '0.9', changefreq: 'monthly' },
      { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    ];
    
    // Get current timestamp for lastmod
    const now = new Date().toISOString();
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${activeBlogPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}/</loc>
    <lastmod>${new Date(post.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback minimal sitemap if data loading fails
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${'https://femitaofeeq.com'}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${'https://femitaofeeq.com'}/about/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${'https://femitaofeeq.com'}/blog/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // Shorter cache for fallback
      },
    });
  }
};
