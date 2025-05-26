#!/usr/bin/env node

/**
 * Blog System Testing Utility - ES Module version
 * Comprehensive tests for blog functionality
 */

import { BlogManager } from './blog-manager.js';
import { BlogPublisher } from './blog-publisher.js';
import { BlogPostGenerator } from './blog-generator.js';
import fetch from 'node-fetch';

class BlogTester {
  constructor() {
    this.tests = [];
    this.results = [];
    this.manager = new BlogManager();
    this.publisher = new BlogPublisher();
    this.generator = new BlogPostGenerator();
  }

  async runTests() {
    console.log('🧪 Starting blog system tests...\n');
    
    this.tests = [
      { name: 'Environment Detection', test: this.testEnvironmentDetection },
      { name: 'API Health Check', test: this.testAPIHealth },
      { name: 'Post Generation', test: this.testPostGeneration },
      { name: 'Template System', test: this.testTemplateSystem },
      { name: 'Single Post Publishing', test: this.testSinglePublishing }
    ];

    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i];
      console.log(`🔬 Test ${i + 1}/${this.tests.length}: ${test.name}`);
      
      try {
        const startTime = Date.now();
        const result = await test.test.call(this);
        const duration = Date.now() - startTime;
        
        this.results.push({
          name: test.name,
          status: 'PASS',
          duration,
          result
        });
        
        console.log(`✅ PASS (${duration}ms)\n`);
        
      } catch (error) {
        this.results.push({
          name: test.name,
          status: 'FAIL',
          error: error.message,
          duration: 0
        });
        
        console.log(`❌ FAIL: ${error.message}\n`);
      }
      
      // Small delay between tests
      await this.sleep(1000);
    }

    this.generateReport();
  }

  async testEnvironmentDetection() {
    const baseUrl = await this.publisher.detectEnvironment();
    
    if (!baseUrl) {
      throw new Error('No environment detected');
    }

    if (!baseUrl.includes('localhost') && !baseUrl.includes('femitaofeeq.com')) {
      throw new Error('Unexpected environment URL');
    }

    return { baseUrl, detected: true };
  }

  async testAPIHealth() {
    const healthResult = await this.manager.healthCheck();
    
    if (healthResult.status !== 'healthy') {
      throw new Error(`API unhealthy: ${healthResult.error || 'Unknown error'}`);
    }

    return healthResult;
  }

  async testPostGeneration() {
    const testData = {
      title: 'Test Post Generation',
      excerpt: 'This is a test post for generation testing',
      templateType: 'cinematography'
    };

    const post = this.generator.generatePost(testData);
    
    if (!post.title || !post.slug || !post.sections) {
      throw new Error('Generated post missing required fields');
    }

    if (post.sections.length === 0) {
      throw new Error('Generated post has no sections');
    }

    return { 
      post: {
        title: post.title,
        slug: post.slug,
        sectionCount: post.sections.length
      }
    };
  }

  async testTemplateSystem() {
    const templates = ['cinematography', 'filmmaking', 'industry-insight'];
    const results = {};

    for (const template of templates) {
      const post = this.generator.generatePost({
        title: `Template Test: ${template}`,
        excerpt: `Testing ${template} template`,
        templateType: template
      });

      if (!post.sections || post.sections.length === 0) {
        throw new Error(`Template ${template} generated no sections`);
      }

      results[template] = {
        sections: post.sections.length,
        hasContent: post.sections.every(s => s.content.length > 0)
      };
    }

    return results;
  }

  async testSinglePublishing() {
    const testPost = {
      title: `Test Post ${Date.now()}`,
      slug: `test-post-${Date.now()}`,
      excerpt: 'This is a test post for automated testing',
      author: 'Blog Tester',
      date: new Date().toISOString().split('T')[0],
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop',
      sections: [
        {
          subtitle: 'Test Section',
          content: 'This is test content for automated testing.',
          order: 0
        }
      ]
    };

    const result = await this.publisher.publishPost(testPost);
    
    if (!result.success) {
      throw new Error(`Publishing failed: ${result.error}`);
    }

    return {
      postId: result.post.id,
      slug: result.post.slug,
      verified: result.verification?.verified || false
    };
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log('');

    // Detailed results
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
    });

    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Your blog system is fully functional.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }

    return {
      passed,
      failed,
      successRate: (passed / this.results.length) * 100,
      totalTime,
      details: this.results
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
const isMainModule = process.argv[1]?.includes('blog-tester.js');
if (isMainModule) {
  const tester = new BlogTester();
  
  console.log('🚀 Blog System Test Suite');
  console.log('=========================\n');
  
  tester.runTests()
    .then(() => {
      console.log('\n✨ Testing complete!');
    })
    .catch(error => {
      console.error('💥 Testing failed:', error.message);
      process.exit(1);
    });
}

export { BlogTester };
