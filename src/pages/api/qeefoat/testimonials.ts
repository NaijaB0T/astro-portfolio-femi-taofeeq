import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData, generateId } from '../../../lib/data';
import type { Testimonial } from '../../../lib/types';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');
    
    const portfolioData = await getPortfolioData(locals.runtime.env);

    if (action === 'published') {
      return new Response(JSON.stringify({
        success: true,
        testimonials: portfolioData.testimonials?.filter(t => t.isPublished) || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (token) {
      const website = portfolioData.websites?.find(w => w.testimonialToken === token);
      if (!website) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired testimonial link'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        website: {
          id: website.id,
          name: website.name,
          url: website.url,
          client: website.client,
          thumbnail: website.thumbnail,
          description: website.description
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Token is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching testimonial data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch data'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { token, clientName, clientEmail, clientAvatar, rating, experience, feedback } = body;

    if (!token || !clientName || !clientEmail || !rating || !experience || !feedback) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All fields are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const portfolioData = await getPortfolioData(locals.runtime.env);
    const website = portfolioData.websites?.find(w => w.testimonialToken === token);
    
    if (!website) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired testimonial link'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const testimonial: Testimonial = {
      id: generateId(),
      websiteId: website.id,
      clientName,
      clientEmail,
      clientAvatar: clientAvatar || '',
      rating: parseInt(rating),
      experience,
      feedback,
      isPublished: true,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };

    if (!portfolioData.testimonials) portfolioData.testimonials = [];
    portfolioData.testimonials.push(testimonial);

    // Invalidate the token after use (one-time use)
    website.testimonialToken = undefined;
    website.testimonialLink = undefined;
    
    await savePortfolioData(locals.runtime.env, portfolioData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Testimonial submitted successfully',
      testimonial
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting testimonial:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit testimonial'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
