import fetch from 'node-fetch';

const blogPostData = {
  "title": "Fixed Production Test Post",
  "slug": "fixed-production-test-post",
  "excerpt": "Testing the fixed blog API with CORS and simplified logic.",
  "author": "Femi Taofeeq",
  "date": "2025-05-26",
  "imageUrl": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop",
  "sections": [
    {
      "subtitle": "Fix Verification",
      "content": "This post tests the CORS and API simplification fixes.",
      "order": 0
    }
  ]
};

async function testBlogAPI() {
  console.log("🚀 Testing fixed blog API...");
  console.log(`📝 Title: ${blogPostData.title}`);
  
  try {
    console.log("\n📡 Making API call to https://femitaofeeq.com/api/blog...");
    
    const response = await fetch('https://femitaofeeq.com/api/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(blogPostData)
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("✅ SUCCESS! Blog post published:", result.title);
    console.log("📄 Post ID:", result.id);
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

async function testBlogGET() {
  try {
    console.log("\n🔍 Testing blog GET API...");
    const response = await fetch('https://femitaofeeq.com/api/blog');
    console.log(`📊 GET Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Blog GET API working! Number of posts: ${data.length}`);
      if (data.length > 0) {
        console.log("📄 Latest post:", data[0]?.title);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Blog GET API failed:", errorText);
    }
  } catch (error) {
    console.log("❌ Connection error:", error.message);
  }
}

// Run tests
testBlogGET().then(() => testBlogAPI());
