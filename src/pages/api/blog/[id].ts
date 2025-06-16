import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../../lib/upload';
import type { BlogPostSection } from '../../../lib/types';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const postId = params.id;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getPortfolioData(locals.runtime.env);
    const postIndex = data.blogPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = data.blogPosts[postIndex];
    
    // Increment view count
    post.viewCount = (post.viewCount || 0) + 1;
    
    // Save updated data
    await savePortfolioData(locals.runtime.env, data);

    return new Response(JSON.stringify(post), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blog post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const postId = params.id;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const data = await getPortfolioData(locals.runtime.env);
    const postIndex = data.blogPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentPost = data.blogPosts[postIndex];
    
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

    // Handle image upload if a new file is provided
    let newImageUrl = imageUrl || currentPost.imageUrl;
    let imageHistory = currentPost.imageHistory || [];
    
    if (imageFile && imageFile.size > 0) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Add current image to history before replacing
      if (currentPost.imageUrl && !imageHistory.includes(currentPost.imageUrl)) {
        imageHistory.push(currentPost.imageUrl);
      }
      
      const uploadResult = await uploadImageToR2(locals.runtime.env, imageFile, 'blog');
      newImageUrl = uploadResult.url;
    } else if (imageUrl && imageUrl !== currentPost.imageUrl) {
      // URL changed, add old one to history
      if (currentPost.imageUrl && !imageHistory.includes(currentPost.imageUrl)) {
        imageHistory.push(currentPost.imageUrl);
      }
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
              id: section.id || String(Date.now()) + '-' + i,
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

    // Update the post data
    data.blogPosts[postIndex] = {
      ...currentPost,
      title: title || currentPost.title,
      slug: slug || currentPost.slug,
      excerpt: excerpt || currentPost.excerpt,
      content: content !== undefined ? content : currentPost.content, // Keep for backward compatibility
      sections: processedSections.length > 0 ? processedSections : currentPost.sections,
      author: author || currentPost.author,
      date: date || currentPost.date,
      imageUrl: newImageUrl,
      imageHistory: imageHistory,
    };

    await savePortfolioData(locals.runtime.env, data);

    return new Response(JSON.stringify({ success: true, message: 'Blog post updated successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    return new Response(JSON.stringify({ error: 'Failed to update blog post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const postId = params.id;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getPortfolioData(locals.runtime.env);
    const post = data.blogPosts.find(p => p.id === postId);
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Archive instead of delete
    post.archived = true;
    await savePortfolioData(locals.runtime.env, data);

    return new Response(JSON.stringify({ success: true, message: 'Blog post archived successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error archiving blog post:', error);
    return new Response(JSON.stringify({ error: 'Failed to archive blog post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
