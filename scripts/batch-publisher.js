#!/usr/bin/env node

/**
 * Batch Blog Publisher - Handle multiple posts with scheduling
 */

const { BlogPublisher } = require('./blog-publisher');
const { BlogPostGenerator } = require('./blog-generator');
const fs = require('fs').promises;

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

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      nextPost: this.queue[0]?.title || 'N/A'
    };
  }

  clearQueue() {
    const cleared = this.queue.length;
    this.queue = [];
    console.log(`🗑️  Cleared ${cleared} posts from queue`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BatchPublisher };

// CLI execution
if (require.main === module) {
  const batch = new BatchPublisher();
  const args = process.argv.slice(2);
  
  (async () => {
    if (args[0] === 'load' && args[1]) {
      await batch.loadFromFile(args[1]);
      console.log('Queue status:', batch.getQueueStatus());
    } else if (args[0] === 'process') {
      const delay = args[1] ? parseInt(args[1]) * 1000 : 5000;
      await batch.processQueue(delay);
    } else {
      console.log(`
📦 Batch Publisher

Usage:
  node batch-publisher.js load <file.json>     - Load posts from file
  node batch-publisher.js process [delay_sec]  - Process queue with delay
      `);
    }
  })();
}
