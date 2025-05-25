import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData, generateId, generateTestimonialToken } from '../../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../../lib/upload';
import type { Website } from '../../../lib/types';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    const portfolioData = await getPortfolioData(locals.runtime.env);

    if (action === 'testimonials') {
      return new Response(JSON.stringify({
        success: true,
        testimonials: portfolioData.testimonials?.filter(t => t.isPublished) || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      websites: portfolioData.websites || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching websites:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch websites'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    const portfolioData = await getPortfolioData(locals.runtime.env);
    
    // Handle JSON requests (for generateTestimonialLink)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { action, websiteId } = body;

      if (action === 'generateTestimonialLink') {
        const website = portfolioData.websites?.find(w => w.id === websiteId);
        
        if (!website) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Website not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const newToken = generateTestimonialToken();
        website.testimonialToken = newToken;
        website.testimonialLink = `/testimonial/${newToken}`;
        
        await savePortfolioData(locals.runtime.env, portfolioData);

        return new Response(JSON.stringify({
          success: true,
          testimonialLink: website.testimonialLink,
          fullUrl: `${new URL(request.url).origin}/testimonial/${newToken}`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON action'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle FormData requests (for create)
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'create') {
      const name = formData.get('name') as string;
      const url = formData.get('url') as string;
      const client = formData.get('client') as string;
      const description = formData.get('description') as string;
      const technologies = formData.get('technologies') as string;
      const thumbnailFile = formData.get('thumbnailFile') as File;
      const thumbnailUrl = formData.get('thumbnailUrl') as string;
      
      if (!name || !url || !client) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Name, URL, and client are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let finalThumbnailUrl = thumbnailUrl || '';
      
      // Handle image upload if file is provided - using your existing upload pattern
      if (thumbnailFile && thumbnailFile.size > 0) {
        const validation = validateImageFile(thumbnailFile);
        if (!validation.valid) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: validation.error 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const uploadResult = await uploadImageToR2(locals.runtime.env, thumbnailFile, 'works');
        finalThumbnailUrl = uploadResult.url;
      }

      const testimonialToken = generateTestimonialToken();
      const newWebsite: Website = {
        id: generateId(),
        name,
        url,
        client,
        thumbnail: finalThumbnailUrl,
        description: description || '',
        technologies: technologies ? technologies.split(',').map(t => t.trim()).filter(t => t) : [],
        createdAt: new Date().toISOString(),
        testimonialToken,
        testimonialLink: `/testimonial/${testimonialToken}`
      };

      if (!portfolioData.websites) portfolioData.websites = [];
      portfolioData.websites.push(newWebsite);
      
      await savePortfolioData(locals.runtime.env, portfolioData);

      return new Response(JSON.stringify({
        success: true,
        website: newWebsite,
        message: 'Website created successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid FormData action'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in POST:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Website ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const portfolioData = await getPortfolioData(locals.runtime.env);
    
    if (!portfolioData.websites) portfolioData.websites = [];
    
    const websiteIndex = portfolioData.websites.findIndex(w => w.id === id);
    if (websiteIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Website not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deletedWebsite = portfolioData.websites.splice(websiteIndex, 1)[0];
    
    // Also remove associated testimonials
    if (portfolioData.testimonials) {
      portfolioData.testimonials = portfolioData.testimonials.filter(t => t.websiteId !== id);
    }
    
    await savePortfolioData(locals.runtime.env, portfolioData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Website deleted successfully',
      website: deletedWebsite
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting website:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete website'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
