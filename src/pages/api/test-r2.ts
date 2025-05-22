import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Test R2 connection
    const testKey = 'test/connection-test.txt';
    const testContent = `R2 connection test at ${new Date().toISOString()}`;
    
    // Try to write a test file
    await locals.runtime.env.BUCKET.put(testKey, testContent);
    
    // Try to read it back
    const result = await locals.runtime.env.BUCKET.get(testKey);
    const content = await result?.text();
    
    // Clean up
    await locals.runtime.env.BUCKET.delete(testKey);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'R2 connection is working',
      testContent: content,
      bucketAvailable: !!locals.runtime.env.BUCKET
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('R2 test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      bucketAvailable: !!locals.runtime.env.BUCKET
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};