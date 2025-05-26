#!/usr/bin/env node

/**
 * Webhook Handler for External Blog Publishing
 * Handles incoming webhooks from Zapier, GitHub Actions, etc.
 */

const express = require('express');
const { BlogManager } = require('./blog-manager');
const crypto = require('crypto');

class WebhookHandler {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.blogManager = new BlogManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Security middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Zapier webhook
    this.app.post('/webhook/zapier', async (req, res) => {
      try {
        console.log('📨 Zapier webhook received');
        const result = await this.handleZapierWebhook(req.body);
        res.json({ success: true, result });
      } catch (error) {
        console.error('❌ Zapier webhook error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GitHub webhook
    this.app.post('/webhook/github', async (req, res) => {
      try {
        console.log('📨 GitHub webhook received');
        const result = await this.handleGitHubWebhook(req.body, req.headers);
        res.json({ success: true, result });
      } catch (error) {
        console.error('❌ GitHub webhook error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Generic webhook
    this.app.post('/webhook/generic', async (req, res) => {
      try {
        console.log('📨 Generic webhook received');
        const result = await this.handleGenericWebhook(req.body);
        res.json({ success: true, result });
      } catch (error) {
        console.error('❌ Generic webhook error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Batch webhook
    this.app.post('/webhook/batch', async (req, res) => {
      try {
        console.log('📨 Batch webhook received');
        const result = await this.handleBatchWebhook(req.body);
        res.json({ success: true, result });
      } catch (error) {
        console.error('❌ Batch webhook error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  async handleZapierWebhook(data) {
    // Zapier sends data in various formats
    const blogData = {
      title: data.title || data.Title || data.post_title,
      excerpt: data.excerpt || data.Excerpt || data.description,
      content: data.content || data.Content || data.body,
      author: data.author || data.Author || 'Femi Taofeeq',
      date: data.date || data.Date || new Date().toISOString().split('T')[0],
      imageUrl: data.imageUrl || data.image_url || data.featured_image,
      templateType: data.template || data.templateType || 'cinematography'
    };

    if (blogData.title && blogData.excerpt) {
      return await this.blogManager.generateAndPublish(blogData);
    } else {
      throw new Error('Missing required fields: title and excerpt');
    }
  }

  async handleGitHubWebhook(data, headers) {
    // Verify GitHub signature if secret is provided
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const signature = headers['x-hub-signature-256'];
      const payload = JSON.stringify(data);
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid GitHub webhook signature');
      }
    }

    // Handle push events
    if (data.ref === 'refs/heads/main' && data.commits?.length > 0) {
      const latestCommit = data.commits[data.commits.length - 1];
      
      const blogData = {
        title: `Development Update: ${latestCommit.message}`,
        excerpt: `Latest changes to the project: ${latestCommit.message}`,
        author: latestCommit.author?.name || 'Femi Taofeeq',
        date: new Date().toISOString().split('T')[0],
        templateType: 'industry-insight',
        customSections: [
          {
            subtitle: 'Commit Details',
            content: `**Message:** ${latestCommit.message}\n\n**Author:** ${latestCommit.author?.name}\n\n**Files Changed:** ${latestCommit.modified?.length || 0}`,
            order: 0
          }
        ]
      };

      return await this.blogManager.generateAndPublish(blogData);
    }

    return { message: 'No action taken for this GitHub event' };
  }

  async handleGenericWebhook(data) {
    // Handle any JSON structure - try to map to blog post format
    const blogData = this.mapGenericData(data);
    
    if (blogData.title && blogData.excerpt) {
      return await this.blogManager.generateAndPublish(blogData);
    } else {
      throw new Error('Could not map data to blog post format');
    }
  }

  async handleBatchWebhook(data) {
    if (!Array.isArray(data.posts)) {
      throw new Error('Batch webhook requires "posts" array');
    }

    const delay = data.delay || 5000;
    const posts = data.posts.map(post => this.mapGenericData(post));
    
    return await this.blogManager.publishBatch(posts, delay);
  }

  mapGenericData(data) {
    // Intelligent mapping of various field names to blog post structure
    const fieldMappings = {
      title: ['title', 'Title', 'name', 'Name', 'heading', 'subject'],
      excerpt: ['excerpt', 'Excerpt', 'description', 'Description', 'summary', 'Summary'],
      content: ['content', 'Content', 'body', 'Body', 'text', 'Text'],
      author: ['author', 'Author', 'creator', 'Creator', 'by'],
      date: ['date', 'Date', 'published', 'Published', 'created', 'timestamp'],
      imageUrl: ['imageUrl', 'image_url', 'image', 'Image', 'featured_image', 'thumbnail']
    };

    const mapped = {};
    
    for (const [targetField, possibleFields] of Object.entries(fieldMappings)) {
      for (const field of possibleFields) {
        if (data[field]) {
          mapped[targetField] = data[field];
          break;
        }
      }
    }

    // Set defaults
    mapped.author = mapped.author || 'Femi Taofeeq';
    mapped.date = mapped.date || new Date().toISOString().split('T')[0];
    mapped.templateType = data.template || data.templateType || 'cinematography';

    return mapped;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Webhook server running on port ${this.port}`);
      console.log(`📡 Endpoints available:`);
      console.log(`   POST http://localhost:${this.port}/webhook/zapier`);
      console.log(`   POST http://localhost:${this.port}/webhook/github`);
      console.log(`   POST http://localhost:${this.port}/webhook/generic`);
      console.log(`   POST http://localhost:${this.port}/webhook/batch`);
      console.log(`   GET  http://localhost:${this.port}/health`);
    });
  }
}

// CLI execution
if (require.main === module) {
  const port = process.env.WEBHOOK_PORT || 3000;
  const handler = new WebhookHandler(port);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down webhook server...');
    process.exit(0);
  });
  
  handler.start();
}

module.exports = { WebhookHandler };
