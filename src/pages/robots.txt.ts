import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const robotsTxt = `
User-agent: *
Allow: /

# Block admin areas
Disallow: /qeefoat/
Disallow: /api/

# Sitemap
Sitemap: https://femitaofeeq.com/sitemap.xml
`.trim();

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
