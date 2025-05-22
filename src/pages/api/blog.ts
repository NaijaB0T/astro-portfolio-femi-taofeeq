import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../lib/upload';
import type { BlogPost, BlogPostSection } from '../../lib/types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    // Filter out archived blog posts for public API
    const activePosts = data.blogPosts.filter(post => !post.archived);
    // Sort blog posts by date in descending order (latest first)
    activePosts.sort((a, b) => b.date.localeCompare(a.date));
    
    return new Response(JSON.stringify(activePosts), {
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const data = await getPortfolioData(locals.runtime.env);
    
    // Extract form fields
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const author = formData.get('author') as string;
    const date = formData.get('date') as string;
    const imageFile = formData.get('imageFile') as File;
    const imageUrl = formData.get('imageUrl') as string;
    const sectionsJson = formData.get('sections') as string;
    
    let finalImageUrl = imageUrl;
    
    // Handle image upload if file is provided
    if (imageFile && imageFile.size > 0) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Uploading blog image file:', imageFile.name, imageFile.size);
      const uploadResult = await uploadImageToR2(locals.runtime.env, imageFile, 'blog');
      finalImageUrl = uploadResult.url;
      console.log('Upload successful, URL:', finalImageUrl);
    } else if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Either upload a file or provide an image URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validate required fields
    if (!title || !slug || !excerpt || !author || !date) {
      return new Response(JSON.stringify({ error: 'Title, slug, excerpt, author, and date are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Process sections if provided
    let processedSections: BlogPostSection[] = [];
    if (sectionsJson) {
      try {
        const sections = JSON.parse(sectionsJson);
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          let sectionImageUrl = section.imageUrl;
          
          // Check for section image file
          const sectionImageFile = formData.get(`section-image-${i}`) as File;
          if (sectionImageFile && sectionImageFile.size > 0) {
            const validation = validateImageFile(sectionImageFile);
            if (!validation.valid) {
              return new Response(JSON.stringify({ error: `Section ${i + 1} image: ${validation.error}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            
            console.log('Uploading section image:', sectionImageFile.name);
            const uploadResult = await uploadImageToR2(locals.runtime.env, sectionImageFile, 'blog-sections');
            sectionImageUrl = uploadResult.url;
          }
          
          if (section.subtitle || section.content) {
            processedSections.push({
              id: String(Date.now()) + '-' + i,
              subtitle: section.subtitle || '',
              content: section.content || '',
              imageUrl: sectionImageUrl,
              order: section.order || i,
            });
          }
        }
        
        // Sort sections by order
        processedSections.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error processing sections:', error);
        return new Response(JSON.stringify({ error: 'Invalid sections data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    const newPost: BlogPost = {
      id: String(Date.now()),
      title,
      slug,
      excerpt,
      content: content || '', // Keep for backward compatibility
      sections: processedSections.length > 0 ? processedSections : undefined,
      author,
      date,
      imageUrl: finalImageUrl,
    };
    
    data.blogPosts.push(newPost);
    await savePortfolioData(locals.runtime.env, data);
    
    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return new Response(JSON.stringify({ error: 'Failed to create blog post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
