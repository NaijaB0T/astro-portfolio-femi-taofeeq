import type { APIRoute } from 'astro';
import { getPortfolioData, savePortfolioData } from '../../lib/data';
import { uploadImageToR2, validateImageFile } from '../../lib/upload';
import type { BlogPost, BlogPostSection } from '../../lib/types';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const data = await getPortfolioData(locals.runtime.env);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    
    // Filter based on archived status
    const posts = includeArchived 
      ? data.blogPosts 
      : data.blogPosts.filter(post => !post.archived);
    
    // Sort blog posts by date in descending order (latest first)
    posts.sort((a, b) => b.date.localeCompare(a.date));
    
    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Blog GET error:', error);
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
    console.log('Blog POST: Starting request processing...');
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    const data = await getPortfolioData(locals.runtime.env);
    console.log('Portfolio data loaded successfully');
    
    let blogData: any = {};
    let imageFiles: { [key: string]: File } = {};

    // Handle both FormData and JSON (simplified logic)
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData...');
      const formData = await request.formData();
      
      // Extract basic fields
      blogData = {
        title: formData.get('title') as string,
        slug: formData.get('slug') as string,
        excerpt: formData.get('excerpt') as string,
        content: formData.get('content') as string || '',
        author: formData.get('author') as string,
        date: formData.get('date') as string,
        imageUrl: formData.get('imageUrl') as string || '',
        sections: []
      };
      
      // Try to parse sections if provided
      const sectionsData = formData.get('sections') as string;
      if (sectionsData) {
        try {
          blogData.sections = JSON.parse(sectionsData);
        } catch (e) {
          console.log('Invalid sections JSON, using empty array');
          blogData.sections = [];
        }
      }
      
      // Handle image file upload
      const imageFile = formData.get('imageFile') as File;
      if (imageFile && imageFile.size > 0) {
        imageFiles['featured'] = imageFile;
      }
      
    } else {
      console.log('Processing JSON...');
      blogData = await request.json();
      
      // Ensure sections is an array
      if (!blogData.sections) {
        blogData.sections = [];
      }
    }

    console.log('Validating required fields...');
    // Basic validation (simplified like works API)
    if (!blogData.title || !blogData.slug || !blogData.excerpt || !blogData.author || !blogData.date) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ 
        error: 'Required fields: title, slug, excerpt, author, date' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate slug
    const existingPost = data.blogPosts.find(post => post.slug === blogData.slug);
    if (existingPost) {
      console.log('Duplicate slug found');
      return new Response(JSON.stringify({ 
        error: 'A blog post with this slug already exists' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let finalImageUrl = blogData.imageUrl || '';
    
    // Handle image upload if provided
    if (imageFiles['featured']) {
      console.log('Uploading featured image...');
      const validation = validateImageFile(imageFiles['featured']);
      if (!validation.valid) {
        return new Response(JSON.stringify({ 
          error: `Featured image: ${validation.error}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const uploadResult = await uploadImageToR2(locals.runtime.env, imageFiles['featured'], 'blog');
      finalImageUrl = uploadResult.url;
      console.log('Image uploaded successfully:', finalImageUrl);
    }

    // Require image (either file or URL)
    if (!finalImageUrl) {
      return new Response(JSON.stringify({ 
        error: 'Featured image is required (file upload or URL)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Process sections (simplified)
    let processedSections: BlogPostSection[] = [];
    if (Array.isArray(blogData.sections)) {
      processedSections = blogData.sections.map((section: any, index: number) => ({
        id: String(Date.now()) + '-' + index,
        subtitle: section.subtitle || '',
        content: section.content || '',
        imageUrl: section.imageUrl || '',
        order: section.order !== undefined ? section.order : index,
      }));
      
      // Sort sections by order
      processedSections.sort((a, b) => a.order - b.order);
    }

    console.log('Creating new blog post...');
    const newPost: BlogPost = {
      id: String(Date.now()),
      title: blogData.title,
      slug: blogData.slug,
      excerpt: blogData.excerpt,
      content: blogData.content || '',
      sections: processedSections.length > 0 ? processedSections : undefined,
      author: blogData.author,
      date: blogData.date,
      imageUrl: finalImageUrl,
      archived: false
    };
    
    data.blogPosts.push(newPost);
    await savePortfolioData(locals.runtime.env, data);
    
    console.log('Blog post created successfully:', newPost.title);
    
    // Return simplified response like works API
    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Blog POST error:', error);
    
    // Simplified error response like works API
    return new Response(JSON.stringify({ 
      error: 'Failed to create blog post'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
