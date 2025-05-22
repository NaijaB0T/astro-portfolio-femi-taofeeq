import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const imagePath = params.path;
    if (!imagePath) {
      return new Response('Image path required', { status: 400 });
    }
    
    // Get the image from R2
    const imageData = await locals.runtime.env.BUCKET.get(imagePath);
    
    if (!imageData) {
      return new Response('Image not found', { status: 404 });
    }
    
    // Get the image as ArrayBuffer
    const imageBuffer = await imageData.arrayBuffer();
    
    // Determine content type from the file extension
    const ext = imagePath.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case 'png': contentType = 'image/png'; break;
      case 'gif': contentType = 'image/gif'; break;
      case 'webp': contentType = 'image/webp'; break;
      case 'jpg':
      case 'jpeg': 
      default: contentType = 'image/jpeg'; break;
    }
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal server error', { status: 500 });
  }
};