export interface Work {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  imageHistory?: string[]; // Previous images
  category: string;
  year: string;
  client: string;
  archived?: boolean;
}

export interface BlogPostSection {
  id: string;
  subtitle: string;
  content: string;
  imageUrl?: string;
  order: number; // To maintain section order
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string; // Keep for backward compatibility
  sections?: BlogPostSection[]; // New sectioned content
  author: string;
  date: string;
  excerpt: string;
  imageUrl: string; // Main/header image
  imageHistory?: string[]; // Previous images
  archived?: boolean;
}

export interface About {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  imageHistory?: string[]; // Previous images
  lastUpdated: string;
}

export interface PortfolioData {
  works: Work[];
  blogPosts: BlogPost[];
  about?: About;
}

export type Env = {
  BUCKET: R2Bucket;
};