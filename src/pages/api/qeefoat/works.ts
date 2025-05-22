import type { APIRoute } from 'astro';
import { getPortfolioData } from '../../../lib/data';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    // Return all works including archived for admin
    return new Response(JSON.stringify(data.works), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch works' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};