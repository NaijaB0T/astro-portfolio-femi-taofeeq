import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../lib/upload';
import type { Work } from '../../lib/types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    // Filter out archived works for public API
    const activeWorks = data.works.filter(work => !work.archived);
    // Sort works by year in descending order (latest first)
    activeWorks.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    
    return new Response(JSON.stringify(activeWorks), {
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const data = await getPortfolioData(locals.runtime.env);
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const year = formData.get('year') as string;
    const client = formData.get('client') as string;
    const thumbnailFile = formData.get('thumbnailFile') as File;
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    
    let finalThumbnailUrl = thumbnailUrl;
    
    // Handle image upload if file is provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const validation = validateImageFile(thumbnailFile);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Uploading thumbnail file:', thumbnailFile.name, thumbnailFile.size);
      const uploadResult = await uploadImageToR2(locals.runtime.env, thumbnailFile, 'works');
      finalThumbnailUrl = uploadResult.url;
      console.log('Upload successful, URL:', finalThumbnailUrl);
    } else if (!thumbnailUrl) {
      return new Response(JSON.stringify({ error: 'Either upload a file or provide an image URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validate required fields
    if (!title || !description || !category || !year || !client) {
      return new Response(JSON.stringify({ error: 'All fields except image are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const newWork: Work = {
      id: String(Date.now()),
      title,
      description,
      thumbnailUrl: finalThumbnailUrl,
      category,
      year,
      client,
    };
    
    data.works.push(newWork);
    await savePortfolioData(locals.runtime.env, data);
    
    return new Response(JSON.stringify(newWork), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating work:', error);
    return new Response(JSON.stringify({ error: 'Failed to create work' }), {
      status: 500,      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
