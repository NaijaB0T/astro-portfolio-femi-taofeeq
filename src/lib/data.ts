import type { PortfolioData, Work, BlogPost, About, Env } from './types';

// Data storage using R2 bucket - consistent with your existing pattern
const DATA_KEY = 'femi-portfolio-data/femi-tao-portfolio-db.json';

export async function getPortfolioData(env: Env): Promise<PortfolioData> {
  try {
    const object = await env.BUCKET.get(DATA_KEY);
    if (!object) {
      // Return default data structure if file doesn't exist
      return {
        works: [],
        blogPosts: [],
        about: undefined,
        websites: [],
        testimonials: []
      };
    }
    
    const data = await object.text();
    const parsed = JSON.parse(data) as PortfolioData;
    
    // Ensure new fields exist for backward compatibility without overwriting existing data
    if (!parsed.websites) parsed.websites = [];
    if (!parsed.testimonials) parsed.testimonials = [];
    
    return parsed;
  } catch (error) {
    console.error('Error loading portfolio data:', error);
    return {
      works: [],
      blogPosts: [],
      about: undefined,
      websites: [],
      testimonials: []
    };
  }
}

export async function savePortfolioData(env: Env, data: PortfolioData): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await env.BUCKET.put(DATA_KEY, jsonData, {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    throw new Error('Failed to save portfolio data');
  }
}

// Helper functions for IDs and tokens
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateTestimonialToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
