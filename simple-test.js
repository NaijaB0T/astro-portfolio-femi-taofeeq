import fetch from 'node-fetch';

const blogPostData = {
  "title": "Test Production Post",
  "slug": "test-production-post-simple",
  "excerpt": "Simple test post for production publishing.",
  "author": "Femi Taofeeq",
  "date": "2025-05-26",
  "imageUrl": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop"
};

async function publishBlogPost() {
  console.log("🚀 Starting simple blog post test...");
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("✅ SUCCESS! Simple post published:", result);
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

publishBlogPost();
