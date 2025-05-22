import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../../lib/upload';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const workId = params.id;
    if (!workId) {
      return new Response(JSON.stringify({ error: 'Work ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getPortfolioData(locals.runtime.env);
    const work = data.works.find(w => w.id === workId);
    
    if (!work) {
      return new Response(JSON.stringify({ error: 'Work not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(work), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching work:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch work' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const workId = params.id;
    if (!workId) {
      return new Response(JSON.stringify({ error: 'Work ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const data = await getPortfolioData(locals.runtime.env);
    const workIndex = data.works.findIndex(w => w.id === workId);
    
    if (workIndex === -1) {
      return new Response(JSON.stringify({ error: 'Work not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentWork = data.works[workIndex];
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const year = formData.get('year') as string;
    const client = formData.get('client') as string;
    const thumbnailFile = formData.get('thumbnailFile') as File;
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    
    let finalThumbnailUrl = thumbnailUrl || currentWork.thumbnailUrl;
    let imageHistory = currentWork.imageHistory || [];
    
    // Handle image upload if file is provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const validation = validateImageFile(thumbnailFile);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const uploadResult = await uploadImageToR2(locals.runtime.env, thumbnailFile, 'works');
      
      // Add current image to history if it's different
      if (currentWork.thumbnailUrl !== uploadResult.url) {
        imageHistory = [currentWork.thumbnailUrl, ...imageHistory.slice(0, 9)]; // Keep last 10 images
      }
      
      finalThumbnailUrl = uploadResult.url;
    } else if (thumbnailUrl && currentWork.thumbnailUrl !== thumbnailUrl) {
      // If using URL and it's different, add old image to history
      imageHistory = [currentWork.thumbnailUrl, ...imageHistory.slice(0, 9)];
    }
    
    // Update work
    data.works[workIndex] = {
      ...currentWork,
      title: title || currentWork.title,
      description: description || currentWork.description,
      category: category || currentWork.category,
      year: year || currentWork.year,
      client: client || currentWork.client,
      thumbnailUrl: finalThumbnailUrl,
      imageHistory
    };
    
    await savePortfolioData(locals.runtime.env, data);

    return new Response(JSON.stringify(data.works[workIndex]), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating work:', error);
    return new Response(JSON.stringify({ error: 'Failed to update work' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const workId = params.id;
    if (!workId) {
      return new Response(JSON.stringify({ error: 'Work ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getPortfolioData(locals.runtime.env);
    const work = data.works.find(w => w.id === workId);
    
    if (!work) {
      return new Response(JSON.stringify({ error: 'Work not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Archive instead of delete
    work.archived = true;
    await savePortfolioData(locals.runtime.env, data);

    return new Response(JSON.stringify({ success: true, message: 'Work archived successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error archiving work:', error);
    return new Response(JSON.stringify({ error: 'Failed to archive work' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};