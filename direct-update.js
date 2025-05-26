import fetch from 'node-fetch';

async function directUpdate() {
  try {
    console.log("🚀 Attempting direct blog array update...");
    
    // Get current posts
    const getResponse = await fetch('https://femitaofeeq.com/api/blog');
    const currentPosts = await getResponse.json();
    console.log(`📊 Current posts: ${currentPosts.length}`);
    
    // Create our new post
    const newPost = {
      "id": "3",
      "title": "From Complete Beginner to Finished Screenplay in One Coffee Break",
      "slug": "complete-beginner-finished-screenplay-coffee-break-2025",
      "excerpt": "What if I told you that someone who has never written a single scene could create a complete, professionally formatted feature film script in just 15 minutes? Here's exactly how the impossible became possible.",
      "author": "Femi Taofeeq",
      "date": "2025-05-26",
      "imageUrl": "https://images.unsplash.com/photo-1489599577332-58f6fd0bb8e8?w=800&h=400&fit=crop&crop=center",
      "content": "**The Impossible Challenge That Changed Everything**\\n\\nLast week, I made what seemed like an impossible bet with a fellow filmmaker: I claimed I could teach a complete beginner—someone who had never written a single line of dialogue or scene description—to create a full-length feature screenplay in just 15 minutes.\\n\\n**The Tools That Make the Impossible Possible**\\n\\nThe secret isn't just in the method—it's in having the right technological partner for the creative process.\\n\\n**Claude Desktop** has revolutionized creative writing by offering unprecedented context awareness. Unlike other AI tools that lose track of story elements as documents grow longer, Claude Desktop maintains perfect continuity across feature-length projects.\\n\\nBut the real game-changer is the **Desktop Commander MCP addon**. This integration allows Claude to write directly to your local files with perfect formatting, maintain story bibles and character consistency documents, and track revisions throughout the development process.\\n\\nThe 15-minute feature film script isn't just possible—it's the new standard for rapid creative development. Your first professional screenplay is just 15 minutes away."
    };
    
    // Add new post to array
    const updatedPosts = [...currentPosts, newPost];
    
    console.log("📡 Updating blog array with PUT...");
    const putResponse = await fetch('https://femitaofeeq.com/api/blog', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedPosts)
    });
    
    console.log(`📊 PUT Response: ${putResponse.status}`);
    
    if (putResponse.ok) {
      console.log("✅ SUCCESS! Blog updated via PUT!");
      console.log(`🔗 URL: https://femitaofeeq.com/blog/${newPost.slug}`);
    } else {
      const errorText = await putResponse.text();
      console.log(`❌ PUT Error: ${errorText}`);
      
      // Try PATCH as alternative
      console.log("🔄 Trying PATCH method...");
      const patchResponse = await fetch('https://femitaofeeq.com/api/blog', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });
      
      console.log(`📊 PATCH Response: ${patchResponse.status}`);
      if (patchResponse.ok) {
        console.log("✅ SUCCESS via PATCH!");
      } else {
        const patchError = await patchResponse.text();
        console.log(`❌ PATCH Error: ${patchError}`);
      }
    }
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

directUpdate();
