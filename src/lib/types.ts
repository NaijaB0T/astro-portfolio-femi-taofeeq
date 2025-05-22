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

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  excerpt: string;
  imageUrl: string;
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