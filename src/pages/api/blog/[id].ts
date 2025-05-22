import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../../lib/upload';

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
    const post = data.blogPosts.find(p => p.id === postId);
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Handle image upload if a new file is provided
    let newImageUrl = currentPost.imageUrl;
    if (imageFile && imageFile.size > 0) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const uploadResult = await uploadImageToR2(locals.runtime.env, imageFile, 'blog');
      newImageUrl = uploadResult.url;
    }

    // Update the post data
    data.blogPosts[postIndex] = {
      ...currentPost,
      title: title || currentPost.title,
      slug: slug || currentPost.slug,
      excerpt: excerpt || currentPost.excerpt,
      content: content || currentPost.content,
      author: author || currentPost.author,
      date: date || currentPost.date,
      imageUrl: newImageUrl,
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
