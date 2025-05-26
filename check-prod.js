import fetch from 'node-fetch';

async function checkProduction() {
  try {
    console.log("🔍 Checking production data structure...");
    const response = await fetch('https://femitaofeeq.com/api/blog');
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("📋 Full response:", JSON.stringify(data, null, 2));
    } else {
      console.log("❌ Failed to get data");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

checkProduction();
