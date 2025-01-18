// imageUtils.js
import axios from 'axios'; 

// Function to get a random image URL from posts with embedded images
function getRandomBlueskyImageURL(posts) {
  // Filter posts that contain embedded images
  const postsWithImages = posts.filter(post => 
    post.embed && 
    post.embed.images && 
    post.embed.images.length > 0
  );

  // If there are posts with embedded images, pick a random one
  if (postsWithImages.length > 0) {
    const randomPost = postsWithImages[Math.floor(Math.random() * postsWithImages.length)];
    const randomImage = randomPost.embed.images[Math.floor(Math.random() * randomPost.embed.images.length)];
    return randomImage.fullsize; // Return the fullsize image URL
  } else {
    return null; // Return null if no images are found
  }
}

export async function getRandomBlueskyImage(query) {

  try {

    const response = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts/?q=${query}&sort=top`);
    const posts = response.data.posts;
      const randomImageURL = getRandomBlueskyImageURL(posts);
    
      if (randomImageURL) {
        return randomImageURL;
      } else {
        return "I can't show that!";
      }


  } catch (error) {
    return "I can't show that!";
  }
}
