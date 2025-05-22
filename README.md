# FemiTaofeeq Portfolio Website

A beautiful portfolio website for FemiTaofeeq, a Lagos-based cinematographer, built with Astro, Cloudflare Workers, and R2 storage.

## Features

- **Portfolio Grid**: Showcase of cinematography works with thumbnails
- **Blog System**: Articles about cinematography and filmmaking
- **Admin Panel**: Content management system to add/edit works and blog posts
- **R2 Storage**: Data stored in Cloudflare R2 as JSON
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components
- **Fast Performance**: Astro static site generation with Cloudflare Workers

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create R2 Bucket
1. Go to Cloudflare Dashboard > R2 Object Storage
2. Create a new bucket named `femi-portfolio-data`
3. Note down your account ID

### 3. Configure Wrangler
Update your Cloudflare account ID in `wrangler.json` if needed.

### 4. Development
```bash
npm run dev
```

### 5. Deploy
```bash
npm run deploy
```

## Technologies Used

- **Astro** - Static site generator
- **Cloudflare Workers** - Serverless runtime
- **Cloudflare R2** - Object storage
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

## License

© 2024 FemiTaofeeq. All rights reserved.