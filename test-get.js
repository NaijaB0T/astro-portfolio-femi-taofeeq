import fetch from 'node-fetch';

async function testProduction() {
  try {
    console.log("🔍 Testing production API GET...");
    const response = await fetch('https://femitaofeeq.com/api/blog');
    console.log(`📊 GET Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Production API working! Posts: ${data.length}`);
      if (data.length > 0) {
        console.log("Sample post:", data[0]?.title);
      }
    } else {
      console.log("❌ Production API GET failed");
    }
  } catch (error) {
    console.log("❌ Connection error:", error.message);
  }
}

testProduction();
