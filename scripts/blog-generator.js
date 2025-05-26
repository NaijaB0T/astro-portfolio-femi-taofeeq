#!/usr/bin/env node

/**
 * Blog Post Generator - Create blog posts from templates and data sources
 * ES Module version for Astro project compatibility
 */

import { promises as fs } from 'fs';
import path from 'path';

export class BlogPostGenerator {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  async loadTemplates() {
    // Define built-in templates
    this.templates.set('cinematography', {
      name: 'Cinematography Article',
      sections: [
        { subtitle: 'Introduction', order: 0 },
        { subtitle: 'Technical Approach', order: 1 },
        { subtitle: 'Visual Storytelling', order: 2 },
        { subtitle: 'Equipment and Setup', order: 3 },
        { subtitle: 'Results and Impact', order: 4 }
      ],
      defaultImageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=400&fit=crop',
      author: 'Femi Taofeeq'
    });

    this.templates.set('filmmaking', {
      name: 'Filmmaking Tutorial',
      sections: [
        { subtitle: 'Overview', order: 0 },
        { subtitle: 'Pre-Production Planning', order: 1 },
        { subtitle: 'Production Techniques', order: 2 },
        { subtitle: 'Post-Production Tips', order: 3 },
        { subtitle: 'Final Thoughts', order: 4 }
      ],
      defaultImageUrl: 'https://images.unsplash.com/photo-1489599577332-58f6fd0bb8e8?w=800&h=400&fit=crop',
      author: 'Femi Taofeeq'
    });

    this.templates.set('industry-insight', {
      name: 'Industry Insight',
      sections: [
        { subtitle: 'Current State of the Industry', order: 0 },
        { subtitle: 'Emerging Trends', order: 1 },
        { subtitle: 'Impact on Filmmakers', order: 2 },
        { subtitle: 'Practical Applications', order: 3 },
        { subtitle: 'Looking Forward', order: 4 }
      ],
      defaultImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop',
      author: 'Femi Taofeeq'
    });
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  generatePost(data) {
    const {
      title,
      excerpt,
      content,
      templateType = 'cinematography',
      customSections = null,
      imageUrl = null,
      date = new Date().toISOString().split('T')[0],
      author = 'Femi Taofeeq'
    } = data;

    if (!title || !excerpt) {
      throw new Error('Title and excerpt are required');
    }

    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Template '${templateType}' not found`);
    }

    const slug = this.generateSlug(title);
    const finalImageUrl = imageUrl || template.defaultImageUrl;

    // Use custom sections if provided, otherwise use template sections
    const sections = customSections || template.sections.map(section => ({
      ...section,
      content: content || `Content for ${section.subtitle} section. Please replace with actual content.`
    }));

    return {
      title,
      slug,
      excerpt,
      author,
      date,
      imageUrl: finalImageUrl,
      sections: sections.map((section, index) => ({
        id: `${Date.now()}-${index}`,
        subtitle: section.subtitle,
        content: section.content,
        imageUrl: section.imageUrl || '',
        order: section.order !== undefined ? section.order : index
      }))
    };
  }

  async generateFromFile(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (Array.isArray(data)) {
        return data.map(postData => this.generatePost(postData));
      } else {
        return [this.generatePost(data)];
      }
    } catch (error) {
      throw new Error(`Failed to generate from file: ${error.message}`);
    }
  }

  listTemplates() {
    const templates = Array.from(this.templates.entries()).map(([key, template]) => ({
      key,
      name: template.name,
      sectionCount: template.sections.length,
      author: template.author
    }));

    console.log('\n📋 Available Templates:');
    templates.forEach(template => {
      console.log(`  ${template.key}: ${template.name} (${template.sectionCount} sections)`);
    });

    return templates;
  }

  async saveTemplate(name, template) {
    this.templates.set(name, template);
    console.log(`✅ Template '${name}' saved successfully`);
  }

  // Quick generation methods
  static quickPost(title, excerpt, content = null) {
    const generator = new BlogPostGenerator();
    return generator.generatePost({
      title,
      excerpt,
      content,
      templateType: 'cinematography'
    });
  }

  static async quickBatch(posts) {
    const generator = new BlogPostGenerator();
    return posts.map(post => generator.generatePost(post));
  }
}

// Sample data for testing
export const samplePosts = [
  {
    title: "Mastering Natural Light in Portrait Photography",
    excerpt: "Learn how to harness available light for stunning portrait work without expensive equipment.",
    templateType: "cinematography",
    customSections: [
      {
        subtitle: "Understanding Light Quality",
        content: "Natural light offers unparalleled beauty and authenticity in portrait photography. The key is understanding how different times of day affect light quality and direction.",
        order: 0
      },
      {
        subtitle: "Golden Hour Techniques",
        content: "The golden hour provides warm, soft light that flatters most subjects. Position your subject with the light coming from a 45-degree angle for optimal results.",
        imageUrl: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&h=300&fit=crop",
        order: 1
      }
    ]
  },
  {
    title: "The Future of Cinema: AI-Assisted Filmmaking",
    excerpt: "Exploring how artificial intelligence is revolutionizing the filmmaking process while preserving creative integrity.",
    templateType: "industry-insight"
  }
];

// CLI interface
const isMainModule = process.argv[1]?.includes('blog-generator.js');
if (isMainModule) {
  const generator = new BlogPostGenerator();
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    switch (command) {
      case 'list':
        generator.listTemplates();
        break;
        
      case 'generate':
        if (args[1]) {
          // Generate from file
          try {
            const posts = await generator.generateFromFile(args[1]);
            console.log('📝 Generated posts:', JSON.stringify(posts, null, 2));
          } catch (error) {
            console.error(error);
          }
        } else {
          // Generate sample posts
          const posts = await BlogPostGenerator.quickBatch(samplePosts);
          console.log('📝 Sample posts generated:', JSON.stringify(posts, null, 2));
        }
        break;
        
      case 'quick':
        if (args[1] && args[2]) {
          const post = BlogPostGenerator.quickPost(args[1], args[2], args[3]);
          console.log('📝 Quick post generated:', JSON.stringify(post, null, 2));
        } else {
          console.log('Usage: node blog-generator.js quick "Title" "Excerpt" "Content"');
        }
        break;
        
      default:
        console.log(`
📚 Blog Post Generator

Usage:
  node blog-generator.js list                    - List available templates
  node blog-generator.js generate [file.json]   - Generate from file or samples
  node blog-generator.js quick "Title" "Excerpt" - Quick generation

Examples:
  node blog-generator.js generate posts.json
  node blog-generator.js quick "My Title" "My excerpt" "My content"
        `);
    }
  })();
}
