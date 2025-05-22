import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../lib/upload';
import type { About } from '../../lib/types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    
    // Return default about if none exists
    const defaultAbout = {
      id: "1",
      title: "About FemiTaofeeq",
      content: "Lagos-based cinematographer with a passion for visual storytelling. I specialize in creating compelling narratives through the lens, bringing stories to life with cinematic excellence.",
      imageUrl: "https://picsum.photos/seed/about/800/600",
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    return new Response(JSON.stringify(data.about || defaultAbout), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch about data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const data = await getPortfolioData(locals.runtime.env);
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const imageFile = formData.get('imageFile') as File;
    const imageUrlFromForm = formData.get('imageUrl') as string;
    
    let finalImageUrl = data.about?.imageUrl || "https://picsum.photos/seed/about/800/600";
    let imageHistory = data.about?.imageHistory || [];
    
    // Handle image upload if file is provided
    if (imageFile && imageFile.size > 0) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const uploadResult = await uploadImageToR2(locals.runtime.env, imageFile, 'about');
      
      // Add current image to history if it exists and is different
      if (data.about?.imageUrl && data.about.imageUrl !== uploadResult.url) {
        imageHistory = [data.about.imageUrl, ...imageHistory.slice(0, 9)]; // Keep last 10 images
      }
      
      finalImageUrl = uploadResult.url;
    } else if (imageUrlFromForm) {
      // If no file, but a URL is provided in the form
      if (data.about?.imageUrl && data.about.imageUrl !== imageUrlFromForm) {
        imageHistory = [data.about.imageUrl, ...imageHistory.slice(0, 9)];
      }
      finalImageUrl = imageUrlFromForm;
    }
    
    const aboutData: About = {
      id: data.about?.id || "1",
      title: title || "About FemiTaofeeq",
      content: content || "",
      imageUrl: finalImageUrl,
      imageHistory,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    data.about = aboutData;
    await savePortfolioData(locals.runtime.env, data);
    
    return new Response(JSON.stringify(aboutData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating about:', error);
    return new Response(JSON.stringify({ error: 'Failed to update about data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
