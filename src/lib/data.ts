import type { PortfolioData, Env } from './types';

const DATA_KEY = 'femi-portfolio-data/femi-tao-portfolio-db.json';

export async function getPortfolioData(env: Env): Promise<PortfolioData> {
  try {
    const data = await env.BUCKET.get(DATA_KEY);
    if (!data) {
      // Initialize with the provided data structure if file doesn't exist
      const initialData = getInitialData();
      await savePortfolioData(env, initialData);
      return initialData;
    }
    const text = await data.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error loading portfolio data from R2:', error);
    throw error;
  }
}

export async function savePortfolioData(env: Env, data: PortfolioData): Promise<void> {
  try {
    await env.BUCKET.put(DATA_KEY, JSON.stringify(data, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
  } catch (error) {
    console.error('Error saving portfolio data to R2:', error);
    throw error;
  }
}

function getInitialData(): PortfolioData {
  return {
    "works": [
      {
        "id": "1",
        "title": "Ephemeral Echoes",
        "description": "A visual journey through fleeting moments in urban landscapes.",
        "thumbnailUrl": "https://picsum.photos/seed/eph1/600/400",
        "category": "Short Film",
        "year": "2023",
        "client": "Independent"
      },
      {
        "id": "2",
        "title": "Nova Apparel Showcase",
        "description": "Dynamic commercial for Nova Apparel's winter collection.",
        "thumbnailUrl": "https://picsum.photos/seed/nova2/600/400",
        "category": "Commercial",
        "year": "2024",
        "client": "Nova Apparel"
      },      {
        "id": "3",
        "title": "The Alchemist's Dream",
        "description": "Music video exploring themes of transformation and wonder.",
        "thumbnailUrl": "https://picsum.photos/seed/alch3/600/400",
        "category": "Music Video",
        "year": "2023",
        "client": "Muse & Melody Records"
      },
      {
        "id": "4",
        "title": "Portraits of Resilience",
        "description": "A documentary short capturing stories of human strength.",
        "thumbnailUrl": "https://picsum.photos/seed/resil4/600/400",
        "category": "Documentary",
        "year": "2022",
        "client": "Hope Foundation"
      }
    ],
    "blogPosts": [
      {
        "id": "1",
        "slug": "the-art-of-lighting-in-cinematography",
        "title": "The Art of Lighting in Cinematography",
        "content": "Lighting is more than just illumination; it's about painting with light, shaping mood, and guiding the viewer's eye. In this post, we explore various lighting techniques and their emotional impact on storytelling. From the soft embrace of natural light to the dramatic interplay of chiaroscuro, understanding light is fundamental to the cinematographer's craft.\\n\\nWe delve into three-point lighting, motivated lighting, and how color temperature can transform a scene. Examples from classic and contemporary films will illustrate these concepts in action.",
        "author": "Femi Taofeeq",
        "date": "2024-07-15",
        "excerpt": "Exploring the crucial role of lighting in shaping mood and narrative in film.",
        "imageUrl": "https://picsum.photos/seed/blog1/800/400"
      },
      {
        "id": "2",
        "slug": "choosing-the-right-lens-a-cinematographers-dilemma",
        "title": "Choosing the Right Lens: A Cinematographer's Dilemma",
        "content": "The lens is the cinematographer's brush. Each focal length, T-stop, and lens characteristic offers a unique perspective on the world. This post discusses the creative and technical considerations behind lens selection.\\n\\nWide-angle lenses can create a sense of scale or intimacy, while telephoto lenses compress space and isolate subjects. We also touch upon anamorphic vs. spherical lenses and the subtle art of depth of field. Choosing a lens isn't just a technical choice; it's a narrative one.",
        "author": "Femi Taofeeq",
        "date": "2024-06-28",
        "excerpt": "A deep dive into the creative and technical aspects of lens selection in filmmaking.",
        "imageUrl": "https://picsum.photos/seed/blog2/800/400"
      }
    ]
  };
}