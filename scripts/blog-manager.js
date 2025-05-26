#!/usr/bin/env node

/**
 * Master Blog Management Script
 * Central hub for all blog publishing operations
 * ES Module version for Astro project compatibility
 */

import { BlogPublisher } from './blog-publisher.js';
import { BlogPostGenerator } from './blog-generator.js';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';

class BatchPublisher {
  constructor() {
    this.publisher = new BlogPublisher();
    this.generator = new BlogPostGenerator();
    this.queue = [];
    this.isProcessing = false;
  }

  addToQueue(posts) {
    if (Array.isArray(posts)) {
      this.queue.push(...posts);
    } else {
      this.queue.push(posts);
    }
    console.log(`📝 Added ${Array.isArray(posts) ? posts.length : 1} posts to queue`);
  }

  async loadFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        this.addToQueue(data);
      } else {
        this.addToQueue([data]);
      }
      
      console.log(`📁 Loaded posts from ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to load file: ${error.message}`);
    }
  }

  async processQueue(delay = 5000) {
    if (this.isProcessing) {
      console.log('⚠️  Batch processing already in progress');
      return;
    }

    if (this.queue.length === 0) {
      console.log('📪 Queue is empty');
      return;
    }

    this.isProcessing = true;
    console.log(`🚀 Starting batch processing of ${this.queue.length} posts`);
    console.log(`⏱️  Delay between posts: ${delay/1000}s\n`);

    const results = [];
    
    for (let i = 0; i < this.queue.length; i++) {
      const post = this.queue[i];
      console.log(`\n📝 Processing ${i + 1}/${this.queue.length}: "${post.title}"`);
      
      try {
        const result = await this.publisher.publishPost(post);
        results.push({ index: i, success: true, result, post });
        
        if (i < this.queue.length - 1) {
          console.log(`⏳ Waiting ${delay/1000}s before next post...`);
          await this.sleep(delay);
        }
        
      } catch (error) {
        console.error(`❌ Failed to publish "${post.title}": ${error.message}`);
        results.push({ index: i, success: false, error: error.message, post });
      }
    }

    // Clear queue and generate report
    this.queue = [];
    this.isProcessing = false;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Batch Processing Complete:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

    return { results, successful, failed };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class BlogMonitor {
  constructor(baseUrl = 'http://localhost:4321') {
    this.baseUrl = baseUrl;
    this.isRunning = false;
    this.checkInterval = 30000; // 30 seconds
    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      lastCheck: null,
      uptime: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      this.stats.totalChecks++;
      
      // Check API endpoints
      const blogApiResponse = await fetch(`${this.baseUrl}/api/blog`, {
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      this.stats.responseTimes.push(responseTime);
      
      // Keep only last 100 response times
      if (this.stats.responseTimes.length > 100) {
        this.stats.responseTimes.shift();
      }
      
      this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
      
      if (blogApiResponse.ok) {
        this.stats.successfulChecks++;
        this.stats.lastCheck = new Date().toISOString();
        
        const data = await blogApiResponse.json();
        
        console.log(`✅ Health Check Passed - ${responseTime}ms`);
        console.log(`📊 Posts: ${data.total || 0} | Success Rate: ${((this.stats.successfulChecks / this.stats.totalChecks) * 100).toFixed(1)}%`);
        
        return {
          status: 'healthy',
          responseTime,
          postCount: data.total || 0,
          timestamp: this.stats.lastCheck
        };
      } else {
        throw new Error(`HTTP ${blogApiResponse.status}`);
      }
      
    } catch (error) {
      this.stats.failedChecks++;
      console.log(`❌ Health Check Failed: ${error.message}`);
      
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  async startMonitoring() {
    this.isRunning = true;
    console.log(`🔍 Starting blog monitoring on ${this.baseUrl}`);
    console.log(`⏱️  Check interval: ${this.checkInterval / 1000}s\n`);
    
    while (this.isRunning) {
      await this.checkHealth();
      await this.sleep(this.checkInterval);
    }
  }

  stopMonitoring() {
    this.isRunning = false;
    console.log('⏹️  Monitoring stopped');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class BlogManager {
  constructor(forceProduction = false) {
    this.publisher = new BlogPublisher();
    this.generator = new BlogPostGenerator();
    this.batchPublisher = new BatchPublisher();
    this.monitor = new BlogMonitor();
    this.forceProduction = forceProduction;
    
    // Set production flag for publisher
    if (forceProduction) {
      process.env.FORCE_PRODUCTION = 'true';
    }
  }

  async publishSingle(data) {
    console.log('📝 Publishing single post...');
    return await this.publisher.publishPost(data);
  }

  async publishBatch(posts, delay = 5000) {
    console.log('📚 Publishing batch...');
    this.batchPublisher.addToQueue(posts);
    return await this.batchPublisher.processQueue(delay);
  }

  async generateAndPublish(generationData) {
    console.log('🏭 Generating and publishing...');
    const post = this.generator.generatePost(generationData);
    return await this.publisher.publishPost(post);
  }

  startMonitoring() {
    console.log('🔍 Starting monitoring...');
    this.monitor.startMonitoring();
  }

  async healthCheck() {
    console.log('🏥 Running health check...');
    return await this.monitor.checkHealth();
  }

  listTemplates() {
    return this.generator.listTemplates();
  }
}

// CLI Interface
const commands = {
  publish: 'Publish a single blog post',
  batch: 'Publish multiple posts from file',
  generate: 'Generate post from template',
  monitor: 'Start monitoring dashboard',
  health: 'Run single health check',
  templates: 'List available templates',
  help: 'Show this help message'
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const isProduction = args.includes('--production');
  
  // Filter out flags to get clean arguments
  const cleanArgs = args.filter(arg => !arg.startsWith('--'));
  
  const manager = new BlogManager(isProduction);
  
  if (isProduction) {
    console.log('🌐 Production mode enabled - publishing to https://femitaofeeq.com');
  }

  switch (command) {
    case 'publish':
      // Sample blog post data for testing
      const blogPostData = {
        "title": "Enhanced Blog System Test Post",
        "slug": "enhanced-blog-system-test-post",
        "excerpt": "Testing the enhanced blog publishing system with all new features including monitoring, verification, and automated workflows.",
        "author": "Femi Taofeeq",
        "date": "2025-05-26",
        "imageUrl": "https://images.unsplash.com/photo-1489599577332-58f6fd0bb8e8?w=800&h=400&fit=crop&crop=center",
        "sections": [
          {
            "subtitle": "Enhanced Features Overview",
            "content": "This test post demonstrates the new enhanced blog publishing system with advanced monitoring, retry logic, and verification capabilities.",
            "order": 0
          },
          {
            "subtitle": "System Capabilities",
            "content": "The system now includes automatic environment detection, real-time health monitoring, batch processing, and comprehensive error handling.",
            "order": 1
          }
        ]
      };
      
      try {
        await manager.publishSingle(blogPostData);
      } catch (error) {
        console.error('❌ Publication failed:', error.message);
      }
      break;

    case 'batch':
      if (cleanArgs[1]) {
        const delay = cleanArgs[2] ? parseInt(cleanArgs[2]) * 1000 : 5000;
        await manager.batchPublisher.loadFromFile(cleanArgs[1]);
        await manager.publishBatch([], delay);
      } else {
        console.log('Usage: node blog-manager.js batch <file.json> [delay_seconds]');
      }
      break;

    case 'generate':
      if (cleanArgs[1] && cleanArgs[2]) {
        const data = {
          title: cleanArgs[1],
          excerpt: cleanArgs[2],
          templateType: cleanArgs[3] || 'cinematography'
        };
        try {
          await manager.generateAndPublish(data);
        } catch (error) {
          console.error('❌ Generation failed:', error.message);
        }
      } else {
        console.log('Usage: node blog-manager.js generate "Title" "Excerpt" [template]');
      }
      break;

    case 'monitor':
      manager.startMonitoring();
      break;

    case 'health':
      await manager.healthCheck();
      break;

    case 'templates':
      manager.listTemplates();
      break;

    case 'help':
    default:
      console.log(`
🎬 Blog Manager - Complete Blog Publishing System

Commands:
${Object.entries(commands).map(([cmd, desc]) => `  ${cmd.padEnd(12)} - ${desc}`).join('\n')}

Examples:
  node blog-manager.js publish
  node blog-manager.js batch posts.json 10
  node blog-manager.js generate "My Title" "My excerpt" cinematography
  node blog-manager.js monitor
  node blog-manager.js health
      `);
  }
}

// CLI execution check
const isMainModule = process.argv[1]?.includes('blog-manager.js');
if (isMainModule) {
  main().catch(console.error);
}
