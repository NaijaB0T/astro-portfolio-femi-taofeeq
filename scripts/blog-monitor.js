#!/usr/bin/env node

/**
 * Blog Monitoring Dashboard
 * Real-time monitoring and health checks for blog system
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;

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

  getStats() {
    return {
      ...this.stats,
      uptimePercentage: ((this.stats.successfulChecks / this.stats.totalChecks) * 100).toFixed(2)
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BlogMonitor };

// CLI execution
if (require.main === module) {
  const monitor = new BlogMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📊 Final Statistics:');
    console.log(monitor.getStats());
    monitor.stopMonitoring();
    process.exit(0);
  });
  
  monitor.startMonitoring();
}
