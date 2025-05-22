import type { Env } from './types';

export async function uploadImage(
  env: Env, 
  file: File, 
  folder: 'works' | 'blog' | 'about'
): Promise<string> {
  try {
    console.log('Starting image upload:', { fileName: file.name, size: file.size, type: file.type });
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `images/${folder}/${timestamp}-${cleanFileName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Upload to R2
    const result = await env.BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    console.log('R2 upload result:', result);
    
    if (!result) {
      throw new Error('R2 upload failed - no result returned');
    }
    
    // For development, return a relative path that will work with R2
    // In production, you'll want to configure a custom domain
    const publicUrl = `https://pub-${env.BUCKET.toString().split('-')[1] || 'unknown'}.r2.dev/${fileName}`;
    
    console.log('Generated public URL:', publicUrl);
    
    return publicUrl;
    
  } catch (error: unknown) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    } else {
      throw new Error('Failed to upload image: An unknown error occurred');
    }
  }
}

// Alternative function that returns the R2 key for direct access
export async function uploadImageToR2(
  env: Env, 
  file: File, 
  folder: 'works' | 'blog' | 'about'
): Promise<{ url: string; key: string }> {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `images/${folder}/${timestamp}-${randomId}.${fileExtension}`;
    
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await env.BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    if (!result) {
      throw new Error('R2 upload failed');
    }
    
    // Return both the key and a placeholder URL
    // The URL will need to be configured based on your R2 setup
    return {
      key: fileName,
      url: `/api/images/${fileName}` // We'll create an API endpoint to serve images
    };
    
  } catch (error: unknown) {
    console.error('Error uploading to R2:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred during R2 upload');
    }
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!file || file.size === 0) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, WebP, or GIF)' };
  }
  
  return { valid: true };
}
