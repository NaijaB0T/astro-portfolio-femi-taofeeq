import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData, generateId } from '../../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../../lib/upload';
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

      // Check if testimonial already exists for this website
      const existingTestimonial = portfolioData.testimonials?.find(t => t.websiteId === website.id);

      return new Response(JSON.stringify({
        success: true,
        website: {
          id: website.id,
          name: website.name,
          url: website.url,
          client: website.client,
          thumbnail: website.thumbnail,
          description: website.description
        },
        existingTestimonial: existingTestimonial || null
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
    const contentType = request.headers.get('content-type') || '';
    const portfolioData = await getPortfolioData(locals.runtime.env);
    
    let token, clientName, clientEmail, clientAvatar, rating, experience, feedback;

    // Handle FormData requests (for file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      token = formData.get('token') as string;
      clientName = formData.get('clientName') as string;
      clientEmail = formData.get('clientEmail') as string;
      rating = formData.get('rating') as string;
      experience = formData.get('experience') as string;
      feedback = formData.get('feedback') as string;
      
      const clientAvatarFile = formData.get('clientAvatarFile') as File;
      clientAvatar = '';
      
      // Handle file upload if provided
      if (clientAvatarFile && clientAvatarFile.size > 0) {
        const validation = validateImageFile(clientAvatarFile);
        if (!validation.valid) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: validation.error 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        const uploadResult = await uploadImageToR2(locals.runtime.env, clientAvatarFile, 'works');
        clientAvatar = uploadResult.url;
      }
    } else {
      // Handle JSON requests (for URL or no avatar)
      const body = await request.json();
      ({ token, clientName, clientEmail, clientAvatar, rating, experience, feedback } = body);
    }

    if (!token || !clientName || !clientEmail || !rating || !experience || !feedback) {
      return new Response(JSON.stringify({
        success: false,
        error: 'All required fields must be filled'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Check if testimonial already exists for this website
    const existingTestimonial = portfolioData.testimonials?.find(t => t.websiteId === website.id);
    
    if (existingTestimonial) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Testimonial already submitted for this website'
      }), {
        status: 400,
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

    // Keep the token active - don't invalidate it
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
