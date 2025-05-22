import type { APIRoute } from 'astro';
import { getPortfolioData } from '../../../lib/data';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    // Return all blog posts including archived for admin
    return new Response(JSON.stringify(data.blogPosts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch blog posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};