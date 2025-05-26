#!/usr/bin/env node

/**
 * Enhanced Blog Publisher with Advanced Monitoring
 * ES Module version for Astro project compatibility
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  // Base URLs - automatically detects environment
  LOCAL_URL: 'http://localhost:4321',
  PRODUCTION_URL: 'https://femitaofeeq.com',
  
  // Monitoring settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  VERIFICATION_ATTEMPTS: 5,
  VERIFICATION_DELAY: 1000, // 1 second between verifications
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: 10000, // 10 seconds
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: 'blog-publish-logs.json',
};

// Logging system
class Logger {
  constructor() {
    this.logs = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      session: this.sessionId
    };
    
    this.logs.push(logEntry);
    
    // Console output with colors
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    };
    
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    
    if (data) {
      console.log(`${color}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  }

  debug(message, data) { this.log('debug', message, data); }
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }

  async saveLogs() {
    try {
      const existingLogs = await this.loadExistingLogs();
      const allLogs = [...existingLogs, ...this.logs];
      
      // Keep only last 1000 log entries
      const recentLogs = allLogs.slice(-1000);
      
      await fs.writeFile(CONFIG.LOG_FILE, JSON.stringify(recentLogs, null, 2));
      this.info(`📝 Logs saved to ${CONFIG.LOG_FILE}`);
    } catch (error) {
      this.error('Failed to save logs', error.message);
    }
  }

  async loadExistingLogs() {
    try {
      const data = await fs.readFile(CONFIG.LOG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  setSessionId(id) {
    this.sessionId = id;
  }
}

const logger = new Logger();

// Enhanced Blog Publisher Class
export class BlogPublisher {
  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.setSessionId(this.sessionId);
    this.startTime = Date.now();
    this.stats = {
      postsAttempted: 0,
      postsSuccessful: 0,
      postsFailed: 0,
      totalRetries: 0,
      verificationsPassed: 0,
      verificationsFailed: 0
    };
  }

  async detectEnvironment() {
    logger.info('🔍 Detecting environment...');
    
    // Force production if environment variable is set
    if (process.env.FORCE_PRODUCTION === 'true' || process.env.BLOG_ENV === 'production') {
      logger.info('🌐 Forcing production environment');
      try {
        const prodResponse = await this.makeRequest(`${CONFIG.PRODUCTION_URL}/api/blog`, {
          method: 'GET',
          timeout: CONFIG.HEALTH_CHECK_TIMEOUT
        });
        
        if (prodResponse.ok) {
          logger.info('🌐 Production environment confirmed');
          return CONFIG.PRODUCTION_URL;
        } else {
          throw new Error('Production server not accessible');
        }
      } catch (error) {
        logger.error('❌ Production server not responding', error.message);
        throw new Error('❌ Production environment forced but not accessible');
      }
    }
    
    // Try production first for blog publishing
    try {
      const prodResponse = await this.makeRequest(`${CONFIG.PRODUCTION_URL}/api/blog`, {
        method: 'GET',
        timeout: CONFIG.HEALTH_CHECK_TIMEOUT
      });
      
      if (prodResponse.ok) {
        logger.info('🌐 Production environment detected');
        return CONFIG.PRODUCTION_URL;
      }
    } catch (error) {
      logger.debug('Production server not responding', error.message);
    }

    try {
      // Fallback to local only if production fails
      const localResponse = await this.makeRequest(`${CONFIG.LOCAL_URL}/api/blog`, {
        method: 'GET',
        timeout: CONFIG.HEALTH_CHECK_TIMEOUT
      });
      
      if (localResponse.ok) {
        logger.warn('⚠️  Using local development environment (production not available)');
        return CONFIG.LOCAL_URL;
      }
    } catch (error) {
      logger.debug('Local server not responding', error.message);
    }

    throw new Error('❌ No accessible environment detected. Please ensure either production or local dev server is accessible.');
  }

  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  async validateBlogPost(blogData) {
    logger.info('✅ Validating blog post data...');
    
    const required = ['title', 'slug', 'excerpt', 'author', 'date'];
    const missing = required.filter(field => !blogData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(blogData.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blogData.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Validate sections if present
    if (blogData.sections && Array.isArray(blogData.sections)) {
      blogData.sections.forEach((section, index) => {
        if (!section.subtitle && !section.content) {
          throw new Error(`Section ${index + 1} must have either subtitle or content`);
        }
      });
    }

    // Image validation
    if (!blogData.imageUrl) {
      logger.warn('⚠️  No featured image provided');
    }

    logger.info('✅ Blog post validation passed');
    return true;
  }

  async publishWithRetry(baseUrl, blogData, attempt = 1) {
    try {
      logger.info(`📤 Publishing attempt ${attempt}/${CONFIG.MAX_RETRIES}...`);
      
      const response = await this.makeRequest(`${baseUrl}/api/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blogData)
      });
      
      logger.debug(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        logger.info('✅ Blog post published successfully!');
        return result;
      } else {
        throw new Error(result.error || 'Unknown API error');
      }
      
    } catch (error) {
      this.stats.totalRetries++;
      logger.error(`❌ Publish attempt ${attempt} failed`, error.message);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        logger.info(`⏳ Retrying in ${CONFIG.RETRY_DELAY}ms...`);
        await this.sleep(CONFIG.RETRY_DELAY);
        return this.publishWithRetry(baseUrl, blogData, attempt + 1);
      } else {
        throw new Error(`Failed after ${CONFIG.MAX_RETRIES} attempts: ${error.message}`);
      }
    }
  }

  async verifyPublication(baseUrl, postSlug, expectedTitle) {
    logger.info('🔍 Starting publication verification...');
    
    for (let attempt = 1; attempt <= CONFIG.VERIFICATION_ATTEMPTS; attempt++) {
      try {
        logger.debug(`Verification attempt ${attempt}/${CONFIG.VERIFICATION_ATTEMPTS}`);
        
        // Method 1: Check via blog list API
        const listResponse = await this.makeRequest(`${baseUrl}/api/blog`);
        const listResult = await listResponse.json();
        
        if (listResult.success) {
          const publishedPost = listResult.posts.find(post => post.slug === postSlug);
          
          if (publishedPost) {
            logger.info('✅ Post found in blog list API');
            
            // Method 2: Direct post verification
            try {
              const directResponse = await this.makeRequest(`${baseUrl}/api/blog/${publishedPost.id}`);
              const directResult = await directResponse.json();
              
              if (directResult.title === expectedTitle) {
                logger.info('✅ Direct post verification successful');
                this.stats.verificationsPassed++;
                
                // Method 3: Web page verification (if possible)
                await this.verifyWebPage(baseUrl, postSlug);
                
                return {
                  verified: true,
                  post: publishedPost,
                  verificationMethods: ['api-list', 'api-direct', 'web-page']
                };
              }
            } catch (directError) {
              logger.warn('⚠️  Direct post verification failed', directError.message);
            }
          }
        }
        
        if (attempt < CONFIG.VERIFICATION_ATTEMPTS) {
          logger.debug(`⏳ Waiting ${CONFIG.VERIFICATION_DELAY}ms before next verification...`);
          await this.sleep(CONFIG.VERIFICATION_DELAY);
        }
        
      } catch (error) {
        logger.warn(`Verification attempt ${attempt} failed`, error.message);
      }
    }
    
    this.stats.verificationsFailed++;
    logger.error('❌ Publication verification failed after all attempts');
    return { verified: false, error: 'Verification timeout' };
  }

  async verifyWebPage(baseUrl, postSlug) {
    try {
      const blogPageResponse = await this.makeRequest(`${baseUrl}/blog`);
      if (blogPageResponse.ok) {
        logger.info('✅ Blog page is accessible');
        
        // Try to access the specific post page
        const postPageResponse = await this.makeRequest(`${baseUrl}/blog/${postSlug}`);
        if (postPageResponse.ok) {
          logger.info('✅ Individual post page is accessible');
        } else {
          logger.warn('⚠️  Individual post page not yet accessible');
        }
      }
    } catch (error) {
      logger.warn('⚠️  Web page verification failed', error.message);
    }
  }

  async generateReport() {
    const duration = Date.now() - this.startTime;
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      stats: this.stats,
      performance: {
        avgRetryTime: this.stats.totalRetries > 0 ? `${(CONFIG.RETRY_DELAY * this.stats.totalRetries / 1000).toFixed(2)}s` : '0s',
        successRate: this.stats.postsAttempted > 0 ? `${((this.stats.postsSuccessful / this.stats.postsAttempted) * 100).toFixed(1)}%` : '0%'
      }
    };

    logger.info('📊 Publication Report', report);
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async publishPost(blogData) {
    try {
      this.stats.postsAttempted++;
      
      // Validate post data
      await this.validateBlogPost(blogData);
      
      // Detect environment
      const baseUrl = await this.detectEnvironment();
      
      // Publish with retry
      const result = await this.publishWithRetry(baseUrl, blogData);
      
      // Verify publication
      const verification = await this.verifyPublication(baseUrl, blogData.slug, blogData.title);
      
      if (verification.verified) {
        this.stats.postsSuccessful++;
        logger.info('🎉 PUBLICATION COMPLETE AND VERIFIED!');
        
        return {
          success: true,
          post: result.post,
          verification,
          urls: {
            blogList: `${baseUrl}/blog`,
            postPage: `${baseUrl}/blog/${blogData.slug}`,
            apiEndpoint: `${baseUrl}/api/blog/${result.post.id}`
          }
        };
      } else {
        logger.error('❌ Publication succeeded but verification failed');
        return {
          success: false,
          error: 'Publication verification failed',
          post: result.post,
          verification
        };
      }
      
    } catch (error) {
      this.stats.postsFailed++;
      logger.error('❌ Publication failed', error.message);
      throw error;
    }
  }

  async publishMultiplePosts(postsArray) {
    logger.info(`📚 Starting batch publication of ${postsArray.length} posts...`);
    
    const results = [];
    
    for (let i = 0; i < postsArray.length; i++) {
      const post = postsArray[i];
      logger.info(`\n📝 Publishing post ${i + 1}/${postsArray.length}: "${post.title}"`);
      
      try {
        const result = await this.publishPost(post);
        results.push({ index: i, success: true, result });
        
        // Small delay between posts to avoid overwhelming the server
        if (i < postsArray.length - 1) {
          await this.sleep(1000);
        }
        
      } catch (error) {
        results.push({ index: i, success: false, error: error.message, post });
      }
    }
    
    // Generate batch report
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`\n📊 Batch Publication Complete:`);
    logger.info(`✅ Successful: ${successful}`);
    logger.info(`❌ Failed: ${failed}`);
    
    return { results, successful, failed };
  }
}

export { CONFIG, Logger };

// CLI execution
const isMainModule = process.argv[1]?.includes('blog-publisher.js');
if (isMainModule) {
  const publisher = new BlogPublisher();
  
  // Load the blog post data (same as original publish-blog.js)
  const blogPostData = {
    "title": "The 15-Minute Feature Film Script: Revolutionary Breakthrough for Indie Filmmakers",
    "slug": "15-minute-feature-film-script-breakthrough-indie-filmmakers",
    "excerpt": "Discover the game-changing method that's allowing complete beginners to craft professional-quality feature film scripts in just 15 minutes. This revolutionary approach is transforming how indie filmmakers develop their stories, eliminating years of traditional screenwriting learning curves.",
    "author": "Femi Taofeeq",
    "date": "2025-05-26",
    "imageUrl": "https://images.unsplash.com/photo-1489599577332-58f6fd0bb8e8?w=800&h=400&fit=crop&crop=center",
    "sections": [
      {
        "subtitle": "The Screenwriting Barrier That's Holding Back Indie Filmmakers",
        "content": "For decades, aspiring filmmakers have faced an impossible choice: spend years mastering the complex art of screenwriting, or abandon their creative vision entirely. Traditional screenwriting education demands months of studying three-act structures, character development, dialogue techniques, and industry formatting standards.\n\n**The harsh reality?** Most indie filmmakers never make it past this initial hurdle. They have brilliant visual ideas, compelling stories burning inside them, but lack the technical screenwriting expertise to translate their vision into a professionally formatted script that can attract actors, investors, and distributors.\n\nThis bottleneck has killed more indie film dreams than budget constraints ever could. Until now.",
        "imageUrl": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop",
        "order": 0
      },
      {
        "subtitle": "The Breakthrough That Changes Everything",
        "content": "What if I told you there's a revolutionary method that allows complete beginners—people who've never written a single scene—to produce a full feature film script in just 15 minutes? \n\nThis isn't about cutting corners or producing low-quality work. We're talking about a systematic approach that leverages cutting-edge AI technology to maintain narrative coherence across 90-120 pages of screenplay while you focus on what you do best: **visual storytelling**.\n\nThe secret lies in **context persistence**—the ability to maintain story continuity, character consistency, and thematic coherence throughout long-form creative writing. Traditional screenwriting software can't do this. Neither can most AI tools. But a revolutionary new approach can.",
        "order": 1
      }
    ]
  };

  // Execute publication
  (async () => {
    try {
      logger.info('🚀 Enhanced Blog Publisher Starting...');
      const result = await publisher.publishPost(blogPostData);
      
      if (result.success) {
        logger.info('\n🎉 SUCCESS! Blog post published and verified!');
        logger.info(`📖 View at: ${result.urls.blogList}`);
        logger.info(`🔗 Direct link: ${result.urls.postPage}`);
      }
      
      await publisher.generateReport();
      await logger.saveLogs();
      
    } catch (error) {
      logger.error('💥 Fatal error during publication', error.message);
      await logger.saveLogs();
      process.exit(1);
    }
  })();
}
