# Blog Post API Documentation

## Overview
Your blog API at `https://femitaofeeq.com/api/blog` now supports full programmatic blog post creation with sections, images, and all metadata.

## Endpoints

### GET `/api/blog`
**Fetch all blog posts**

**Query Parameters:**
- `includeArchived=true` - Include archived posts (default: false)

**Response:**
```json
{
  "success": true,
  "posts": [...],
  "total": 5
}
```

### POST `/api/blog`
**Create a new blog post**

## Method 1: JSON Submission (URLs only)

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "title": "My Amazing Blog Post",
  "slug": "my-amazing-blog-post",
  "excerpt": "A brief description of the post",
  "content": "Legacy content (optional)",
  "author": "Femi Taofeeq",
  "date": "2025-05-26",
  "imageUrl": "https://example.com/featured-image.jpg",
  "sections": [
    {
      "subtitle": "Introduction",
      "content": "This is the introduction section with **markdown** support.",
      "imageUrl": "https://example.com/section1.jpg",
      "order": 0
    },
    {
      "subtitle": "Main Content",
      "content": "This is the main content section.",
      "order": 1
    },
    {
      "subtitle": "Conclusion",
      "content": "Final thoughts and conclusions.",
      "imageUrl": "https://example.com/conclusion.jpg",
      "order": 2
    }
  ]
}
```

## Method 2: FormData Submission (File Uploads)

**Content-Type:** `multipart/form-data`

**Form Fields:**
```
title: "My Amazing Blog Post"
slug: "my-amazing-blog-post"
excerpt: "A brief description"
content: "Legacy content (optional)"
author: "Femi Taofeeq"
date: "2025-05-26"
imageUrl: "https://fallback-url.jpg" (optional if uploading file)
sections: '[{"subtitle":"Intro","content":"...","order":0}]' (JSON string)

// File uploads:
imageFile: [File] (featured image)
section-image-0: [File] (image for section 0)
section-image-1: [File] (image for section 1)
```

## Example API Calls

### 1. Simple JSON Post (URLs only)
```javascript
const response = await fetch('https://femitaofeeq.com/api/blog', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "The Art of Lighting in Film",
    slug: "art-of-lighting-film-2025",
    excerpt: "Exploring advanced lighting techniques for cinematic storytelling",
    author: "Femi Taofeeq",
    date: "2025-05-26",
    imageUrl: "https://images.unsplash.com/photo-lighting-setup",
    sections: [
      {
        subtitle: "Natural Light Techniques",
        content: "Working with available light sources...",
        order: 0
      },
      {
        subtitle: "Artificial Lighting Setup",
        content: "Setting up professional lighting rigs...",
        imageUrl: "https://images.unsplash.com/lighting-rig",
        order: 1
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

### 2. FormData with File Uploads
```javascript
const formData = new FormData();

// Basic fields
formData.append('title', 'Behind the Scenes: My Latest Project');
formData.append('slug', 'behind-scenes-latest-project');
formData.append('excerpt', 'A look at the making of my recent film');
formData.append('author', 'Femi Taofeeq');
formData.append('date', '2025-05-26');

// Featured image file
formData.append('imageFile', featuredImageFile);

// Sections as JSON
formData.append('sections', JSON.stringify([
  {
    subtitle: "Pre-Production",
    content: "Planning and preparation phase...",
    order: 0
  },
  {
    subtitle: "On Set",
    content: "Filming day experiences...",
    order: 1
  }
]));

// Section images
formData.append('section-image-0', preProductionImage);
formData.append('section-image-1', onSetImage);

const response = await fetch('https://femitaofeeq.com/api/blog', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### 3. Node.js Example with File Upload
```javascript
import FormData from 'form-data';
import fs from 'fs';

const formData = new FormData();
formData.append('title', 'My New Blog Post');
formData.append('slug', 'my-new-blog-post');
formData.append('excerpt', 'This is a test post');
formData.append('author', 'Femi Taofeeq');
formData.append('date', '2025-05-26');
formData.append('imageFile', fs.createReadStream('./featured-image.jpg'));

const sections = [
  {
    subtitle: "Introduction",
    content: "This is the intro...",
    order: 0
  }
];
formData.append('sections', JSON.stringify(sections));

const response = await fetch('https://femitaofeeq.com/api/blog', {
  method: 'POST',
  body: formData
});
```

## Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "post": {
    "id": "1748123456789",
    "title": "My Amazing Blog Post",
    "slug": "my-amazing-blog-post",
    "excerpt": "A brief description",
    "content": "",
    "sections": [...],
    "author": "Femi Taofeeq",
    "date": "2025-05-26",
    "imageUrl": "/api/images/images/blog/1748123456789-abc123.jpg",
    "archived": false
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "A blog post with this slug already exists"
}
```

## Image Handling

### Supported Formats
- JPEG, PNG, WebP, GIF
- Max size: 20MB
- Automatic R2 storage

### Image URLs
- Uploaded files get URLs like: `/api/images/images/blog/timestamp-id.jpg`
- External URLs are stored as-is
- Section images stored in: `/api/images/images/blog/`

## Field Requirements

**Required Fields:**
- `title` - Blog post title
- `slug` - URL-friendly identifier (must be unique)
- `excerpt` - Brief description
- `author` - Post author
- `date` - Publication date (YYYY-MM-DD format)
- `imageUrl` OR `imageFile` - Featured image

**Optional Fields:**
- `content` - Legacy content field
- `sections` - Array of blog sections

## Section Structure

```typescript
interface BlogPostSection {
  subtitle: string;        // Section title
  content: string;         // Section content (supports Markdown)
  imageUrl?: string;       // Optional section image
  order: number;           // Display order (0, 1, 2...)
}
```

## Error Codes

- `400` - Bad Request (missing required fields, invalid data)
- `500` - Server Error (upload failure, database error)

## Use Cases

1. **Headless CMS Integration** - Connect external tools
2. **Mobile App Publishing** - Post from mobile apps
3. **Automated Publishing** - Scheduled posts via scripts
4. **Third-party Tool Integration** - Notion, Airtable, etc.
5. **Bulk Import** - Migrate from other platforms

Your blog API is now production-ready for external integrations! 🚀
