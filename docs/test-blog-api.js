// Blog API Test Script
// Run this in your browser console or Node.js to test the API

async function testBlogAPI() {
  const baseURL = 'https://femitaofeeq.com/api/blog';
  // For local testing, use: 'http://localhost:4321/api/blog'
  
  console.log('🧪 Testing Blog API...');
  
  // Test 1: GET all posts
  console.log('\n📖 Test 1: Fetching all blog posts...');
  try {
    const response = await fetch(baseURL);
    const result = await response.json();
    console.log('✅ GET Success:', result.success);
    console.log(`📊 Total posts: ${result.total}`);
  } catch (error) {
    console.error('❌ GET Failed:', error);
  }
  
  // Test 2: Create new post with JSON (URLs only)
  console.log('\n✍️ Test 2: Creating blog post with JSON...');
  
  const testPost = {
    title: `API Test Post ${Date.now()}`,
    slug: `api-test-post-${Date.now()}`,
    excerpt: 'This is a test post created via API',
    author: 'Femi Taofeeq',
    date: '2025-05-26',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop',
    sections: [
      {
        subtitle: 'Introduction',
        content: 'This is the introduction section created via API. It supports **markdown** formatting!',
        order: 0
      },
      {
        subtitle: 'Main Content',
        content: 'This is the main content section with detailed information about the API functionality.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        order: 1
      },
      {
        subtitle: 'Conclusion',
        content: 'The API is working perfectly and can handle multiple sections with ease.',
        order: 2
      }
    ]
  };
  
  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPost)
    });
    
    const result = await response.json();
    console.log('✅ POST Success:', result.success);
    console.log('📝 Created post:', result.post?.title);
    console.log('🔗 Post slug:', result.post?.slug);
    console.log('📷 Featured image:', result.post?.imageUrl);
    console.log(`📚 Sections: ${result.post?.sections?.length || 0}`);
    
    if (result.post?.sections) {
      result.post.sections.forEach((section, index) => {
        console.log(`   Section ${index + 1}: ${section.subtitle}`);
      });
    }
    
  } catch (error) {
    console.error('❌ POST Failed:', error);
  }
  
  console.log('\n🎉 API tests completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Check your blog at: https://femitaofeeq.com/blog');
  console.log('2. Try uploading files using FormData');
  console.log('3. Integrate with external tools like Zapier, n8n, etc.');
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBlogAPI };
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Run testBlogAPI() to test your blog API');
}

// Example with file upload (for reference)
async function testFileUpload() {
  const formData = new FormData();
  
  formData.append('title', 'Test Post with File Upload');
  formData.append('slug', `file-upload-test-${Date.now()}`);
  formData.append('excerpt', 'Testing file upload functionality');
  formData.append('author', 'Femi Taofeeq');
  formData.append('date', '2025-05-26');
  
  // Add sections
  formData.append('sections', JSON.stringify([
    {
      subtitle: 'File Upload Test',
      content: 'This section tests file upload capabilities.',
      order: 0
    }
  ]));
  
  // Note: You'll need to get file input elements for actual files
  // formData.append('imageFile', fileInput.files[0]);
  // formData.append('section-image-0', sectionFileInput.files[0]);
  
  const response = await fetch('https://femitaofeeq.com/api/blog', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('File upload result:', result);
}

// Example integration with external services
const exampleIntegrations = {
  // Zapier webhook
  zapier: `
    // In Zapier, use a webhook with:
    // URL: https://femitaofeeq.com/api/blog
    // Method: POST
    // Headers: Content-Type: application/json
    // Body: {JSON structure as shown above}
  `,
  
  // n8n workflow
  n8n: `
    // In n8n, use HTTP Request node:
    // URL: https://femitaofeeq.com/api/blog
    // Method: POST
    // Body Parameters: Add your blog data
  `,
  
  // GitHub Actions
  githubActions: `
    # In .github/workflows/blog.yml
    - name: Create Blog Post
      run: |
        curl -X POST https://femitaofeeq.com/api/blog \\
          -H "Content-Type: application/json" \\
          -d '{"title":"${{ github.event.head_commit.message }}","slug":"auto-post","excerpt":"Auto-generated","author":"Femi Taofeeq","date":"$(date +%Y-%m-%d)","imageUrl":"https://example.com/image.jpg"}'
  `
};
