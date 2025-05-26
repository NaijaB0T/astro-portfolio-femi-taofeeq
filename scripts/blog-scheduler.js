#!/usr/bin/env node

/**
 * Blog Scheduler - Automated time-based publishing
 */

const fs = require('fs').promises;
const { BlogManager } = require('./blog-manager');

class BlogScheduler {
  constructor() {
    this.blogManager = new BlogManager();
    this.scheduledPosts = new Map();
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
    this.scheduleFile = 'blog-schedule.json';
  }

  async loadSchedule() {
    try {
      const data = await fs.readFile(this.scheduleFile, 'utf8');
      const schedule = JSON.parse(data);
      
      schedule.forEach(item => {
        this.scheduledPosts.set(item.id, {
          ...item,
          publishTime: new Date(item.publishTime)
        });
      });
      
      console.log(`📅 Loaded ${this.scheduledPosts.size} scheduled posts`);
    } catch (error) {
      console.log('📅 No existing schedule found, starting fresh');
    }
  }

  async saveSchedule() {
    const schedule = Array.from(this.scheduledPosts.values()).map(item => ({
      ...item,
      publishTime: item.publishTime.toISOString()
    }));
    
    await fs.writeFile(this.scheduleFile, JSON.stringify(schedule, null, 2));
    console.log(`💾 Schedule saved with ${schedule.length} posts`);
  }

  schedulePost(postData, publishTime, options = {}) {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledItem = {
      id,
      postData,
      publishTime: new Date(publishTime),
      status: 'scheduled',
      recurring: options.recurring || false,
      recurringInterval: options.recurringInterval || null,
      maxRetries: options.maxRetries || 3,
      retryCount: 0,
      created: new Date(),
      tags: options.tags || []
    };

    this.scheduledPosts.set(id, scheduledItem);
    console.log(`📅 Scheduled post "${postData.title}" for ${publishTime}`);
    
    return id;
  }

  unschedulePost(id) {
    if (this.scheduledPosts.has(id)) {
      const post = this.scheduledPosts.get(id);
      this.scheduledPosts.delete(id);
      console.log(`🗑️  Unscheduled post "${post.postData.title}"`);
      return true;
    }
    return false;
  }

  async checkScheduledPosts() {
    const now = new Date();
    const readyPosts = Array.from(this.scheduledPosts.values())
      .filter(item => item.status === 'scheduled' && item.publishTime <= now);

    for (const item of readyPosts) {
      await this.executeScheduledPost(item);
    }
  }

  async executeScheduledPost(item) {
    try {
      console.log(`🚀 Publishing scheduled post: "${item.postData.title}"`);
      
      const result = await this.blogManager.publishSingle(item.postData);
      
      if (result.success) {
        item.status = 'published';
        item.publishedAt = new Date();
        item.result = result;
        
        console.log(`✅ Successfully published: "${item.postData.title}"`);
        
        // Handle recurring posts
        if (item.recurring && item.recurringInterval) {
          this.scheduleRecurringPost(item);
        }
      } else {
        throw new Error(result.error || 'Publication failed');
      }
      
    } catch (error) {
      item.retryCount++;
      console.error(`❌ Failed to publish "${item.postData.title}": ${error.message}`);
      
      if (item.retryCount < item.maxRetries) {
        // Retry in 5 minutes
        item.publishTime = new Date(Date.now() + 5 * 60 * 1000);
        console.log(`⏰ Retrying in 5 minutes (attempt ${item.retryCount + 1}/${item.maxRetries})`);
      } else {
        item.status = 'failed';
        item.error = error.message;
        console.error(`💀 Max retries exceeded for "${item.postData.title}"`);
      }
    }
  }

  scheduleRecurringPost(originalItem) {
    const nextPublishTime = new Date(originalItem.publishTime);
    
    switch (originalItem.recurringInterval) {
      case 'daily':
        nextPublishTime.setDate(nextPublishTime.getDate() + 1);
        break;
      case 'weekly':
        nextPublishTime.setDate(nextPublishTime.getDate() + 7);
        break;
      case 'monthly':
        nextPublishTime.setMonth(nextPublishTime.getMonth() + 1);
        break;
      default:
        console.warn(`Unknown recurring interval: ${originalItem.recurringInterval}`);
        return;
    }

    const newId = this.schedulePost(
      originalItem.postData,
      nextPublishTime,
      {
        recurring: true,
        recurringInterval: originalItem.recurringInterval,
        tags: originalItem.tags
      }
    );

    console.log(`🔄 Scheduled recurring post for ${nextPublishTime.toISOString()}`);
  }

  async start() {
    this.isRunning = true;
    await this.loadSchedule();
    
    console.log(`⏰ Blog scheduler started, checking every ${this.checkInterval / 1000}s`);
    
    while (this.isRunning) {
      await this.checkScheduledPosts();
      await this.saveSchedule();
      await this.sleep(this.checkInterval);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️  Blog scheduler stopped');
  }

  getSchedule() {
    return Array.from(this.scheduledPosts.values())
      .sort((a, b) => a.publishTime - b.publishTime);
  }

  getStats() {
    const posts = Array.from(this.scheduledPosts.values());
    return {
      total: posts.length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
      failed: posts.filter(p => p.status === 'failed').length,
      recurring: posts.filter(p => p.recurring).length
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Quick scheduling helpers
  scheduleDaily(postData, time = '09:00') {
    const [hours, minutes] = time.split(':');
    const publishTime = new Date();
    publishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (publishTime <= new Date()) {
      publishTime.setDate(publishTime.getDate() + 1);
    }

    return this.schedulePost(postData, publishTime, {
      recurring: true,
      recurringInterval: 'daily',
      tags: ['daily', 'automated']
    });
  }

  scheduleWeekly(postData, dayOfWeek = 1, time = '09:00') {
    const [hours, minutes] = time.split(':');
    const publishTime = new Date();
    const currentDay = publishTime.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    
    publishTime.setDate(publishTime.getDate() + daysUntilTarget);
    publishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return this.schedulePost(postData, publishTime, {
      recurring: true,
      recurringInterval: 'weekly',
      tags: ['weekly', 'automated']
    });
  }
}

// CLI interface
if (require.main === module) {
  const scheduler = new BlogScheduler();
  const args = process.argv.slice(2);
  const command = args[0];

  const commands = {
    start: 'Start the scheduler daemon',
    schedule: 'Schedule a post from JSON file',
    list: 'List all scheduled posts',
    stats: 'Show scheduler statistics',
    unschedule: 'Remove a scheduled post by ID',
    help: 'Show this help message'
  };

  switch (command) {
    case 'start':
      process.on('SIGINT', async () => {
        console.log('\n📊 Final Statistics:');
        console.log(scheduler.getStats());
        scheduler.stop();
        await scheduler.saveSchedule();
        process.exit(0);
      });
      
      scheduler.start();
      break;

    case 'schedule':
      (async () => {
        if (args[1] && args[2]) {
          const postData = JSON.parse(await fs.readFile(args[1], 'utf8'));
          const publishTime = args[2];
          const id = scheduler.schedulePost(postData, publishTime);
          await scheduler.saveSchedule();
          console.log(`✅ Scheduled with ID: ${id}`);
        } else {
          console.log('Usage: node blog-scheduler.js schedule <post.json> <ISO_DATE_TIME>');
        }
      })();
      break;

    case 'list':
      (async () => {
        await scheduler.loadSchedule();
        const schedule = scheduler.getSchedule();
        console.log('\n📅 Scheduled Posts:');
        schedule.forEach(item => {
          console.log(`  ${item.id}: "${item.postData.title}" at ${item.publishTime.toISOString()} [${item.status}]`);
        });
      })();
      break;

    case 'stats':
      (async () => {
        await scheduler.loadSchedule();
        console.log('📊 Scheduler Statistics:', scheduler.getStats());
      })();
      break;

    case 'unschedule':
      (async () => {
        if (args[1]) {
          await scheduler.loadSchedule();
          const success = scheduler.unschedulePost(args[1]);
          if (success) {
            await scheduler.saveSchedule();
            console.log('✅ Post unscheduled');
          } else {
            console.log('❌ Post not found');
          }
        } else {
          console.log('Usage: node blog-scheduler.js unschedule <post_id>');
        }
      })();
      break;

    case 'help':
    default:
      console.log(`
⏰ Blog Scheduler

Commands:
${Object.entries(commands).map(([cmd, desc]) => `  ${cmd.padEnd(12)} - ${desc}`).join('\n')}

Examples:
  node blog-scheduler.js start
  node blog-scheduler.js schedule post.json "2025-05-27T09:00:00Z"
  node blog-scheduler.js list
  node blog-scheduler.js stats
      `);
  }
}

module.exports = { BlogScheduler };
