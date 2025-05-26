import fetch from 'node-fetch';

async function testWorksAPI() {
  try {
    console.log("🔍 Testing works API GET...");
    const response = await fetch('https://femitaofeeq.com/api/works');
    console.log(`📊 Works GET Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Works API working! Number of works: ${data.length}`);
      if (data.length > 0) {
        console.log("Sample work:", data[0]?.title);
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Works API GET failed:", errorText);
    }
  } catch (error) {
    console.log("❌ Connection error:", error.message);
  }
}

async function testWorksAPIPost() {
  const workData = {
    title: "Test Work Post",
    description: "Testing works API post functionality",
    category: "Test",
    year: "2025",
    client: "Test Client"
  };

  try {
    console.log("\n🚀 Testing works API POST...");
    
    // Create FormData
    const formData = new FormData();
    formData.append('title', workData.title);
    formData.append('description', workData.description);
    formData.append('category', workData.category);
    formData.append('year', workData.year);
    formData.append('client', workData.client);
    formData.append('thumbnailUrl', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop');
    
    const response = await fetch('https://femitaofeeq.com/api/works', {
      method: 'POST',
      body: formData
    });
    
    console.log(`📊 Works POST Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Works POST successful!", result.title);
    } else {
      const errorText = await response.text();
      console.log("❌ Works POST failed:", errorText);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testWorksAPI().then(() => testWorksAPIPost());
