#!/usr/bin/env node

/**
 * Blog System Quick Reference
 * Shows all available commands and options
 * ES Module version for Astro project compatibility
 */

console.log(`
🎬 ENHANCED BLOG PUBLISHING SYSTEM
==================================

🚀 QUICK START COMMANDS:
------------------------
npm run blog:test         # Run comprehensive tests
npm run blog:health       # Quick health check  
npm run blog:publish      # Publish enhanced blog post
npm run blog:monitor      # Start real-time monitoring

📚 CORE FUNCTIONALITY:
---------------------
npm run blog:publish      # Enhanced single post publishing
npm run blog:publish-legacy # Original script (preserved)
npm run blog:generate     # Generate posts from templates
npm run blog:batch <file> # Batch publish from JSON file
npm run blog:templates    # List available templates
npm run blog:health       # System health check
npm run blog:monitor      # Real-time monitoring dashboard
npm run blog:help         # Show detailed help

⚡ ADVANCED FEATURES:
--------------------
npm run blog:webhook      # Start webhook server (port 3000)
npm run blog:schedule     # Start scheduling daemon
npm run blog:test         # Run comprehensive test suite

🛠️ MANUAL COMMANDS:
-------------------
node scripts/blog-manager.js generate "Title" "Excerpt" "template"
node scripts/blog-generator.js quick "Title" "Excerpt"

📦 BATCH PROCESSING:
-------------------
npm run blog:batch sample-posts.json     # Use sample posts
npm run blog:batch posts.json 10         # 10 second delay
node scripts/blog-manager.js batch posts.json 5

🎨 AVAILABLE TEMPLATES:
----------------------
- cinematography    # Technical cinematography content
- filmmaking       # Tutorials and guides
- industry-insight # Analysis and trends

📊 MONITORING & LOGS:
--------------------
- Real-time dashboard: npm run blog:monitor
- Log file: blog-publish-logs.json
- Config file: blog-config.json

🔧 CONFIGURATION:
----------------
Edit blog-config.json for:
- Retry settings
- Verification attempts  
- Monitoring intervals
- Default values

🧪 TESTING:
----------
npm run blog:test                    # Full test suite

🚨 TROUBLESHOOTING:
------------------
1. npm run blog:health               # Check system status
2. LOG_LEVEL=debug npm run blog:publish # Debug mode
3. Check blog-publish-logs.json      # Review logs
4. npm run blog:test                 # Run diagnostics

🎯 EXAMPLE WORKFLOWS:
--------------------

Development Testing:
npm run dev                      # Terminal 1
npm run blog:monitor             # Terminal 2  
npm run blog:test                # Terminal 3

Content Publishing:
npm run blog:generate
npm run blog:batch sample-posts.json 30
npm run blog:health

🎉 Your blog system is ready! Start with: npm run blog:test
`);

export default {};
