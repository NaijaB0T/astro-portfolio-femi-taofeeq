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

// New interfaces for website and testimonial management
export interface Website {
  id: string;
  name: string;
  url: string;
  client: string;
  thumbnail: string;
  imageHistory?: string[]; // Previous thumbnail images
  description?: string;
  technologies?: string[];
  createdAt: string;
  testimonialLink?: string;
  testimonialToken?: string;
}

export interface Testimonial {
  id: string;
  websiteId: string;
  clientName: string;
  clientEmail: string;
  clientAvatar?: string;
  rating: number;
  experience: string;
  feedback: string;
  isPublished: boolean;
  createdAt: string;
  submittedAt: string;
}

export interface PortfolioData {
  works: Work[];
  blogPosts: BlogPost[];
  about?: About;
  websites?: Website[]; // New field for website management
  testimonials?: Testimonial[]; // New field for testimonials
}

export type Env = {
  BUCKET: R2Bucket;
};