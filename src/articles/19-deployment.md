---
title: "Deployment"
description: "Deploy your SvelteKit app to production. Learn about adapters, environment variables, and deployment platforms like Vercel, Netlify, and Cloudflare."
tags: ["svelte", "sveltekit", "deployment"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 20
---

# Lesson 19: Deployment

Your app is ready. Time to ship it. SvelteKit uses adapters to deploy to different platforms — from serverless to Node.js to static hosting.

## How Adapters Work

SvelteKit builds your app, then an adapter transforms it for a specific platform:

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-vercel";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

The adapter handles platform-specific details like serverless functions, edge functions, and static file serving.

## Auto Adapter

The default adapter tries to detect your platform:

```javascript
import adapter from "@sveltejs/adapter-auto";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

It works with Vercel, Netlify, Cloudflare Pages, and Azure Static Web Apps automatically. Great for getting started.

## Vercel

```bash
npm i -D @sveltejs/adapter-vercel
```

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-vercel";

export default {
  kit: {
    adapter: adapter({
      // Optional: specify runtime
      runtime: "nodejs20.x",

      // Optional: edge functions
      // runtime: 'edge'
    }),
  },
};
```

Deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo for automatic deployments.

## Netlify

```bash
npm i -D @sveltejs/adapter-netlify
```

```javascript
import adapter from "@sveltejs/adapter-netlify";

export default {
  kit: {
    adapter: adapter({
      // Use edge functions
      edge: false,

      // Split into multiple functions
      split: false,
    }),
  },
};
```

Add `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "build"
```

## Cloudflare Pages

```bash
npm i -D @sveltejs/adapter-cloudflare
```

```javascript
import adapter from "@sveltejs/adapter-cloudflare";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

Cloudflare Workers run at the edge, giving excellent performance globally.

## Node.js Server

For traditional hosting (VPS, Docker):

```bash
npm i -D @sveltejs/adapter-node
```

```javascript
import adapter from "@sveltejs/adapter-node";

export default {
  kit: {
    adapter: adapter({
      out: "build",
      precompress: true,
    }),
  },
};
```

Build and run:

```bash
npm run build
node build
```

Or with PM2:

```bash
pm2 start build/index.js --name my-app
```

## Static Site Generation

For fully static sites (no server):

```bash
npm i -D @sveltejs/adapter-static
```

```javascript
import adapter from "@sveltejs/adapter-static";

export default {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "404.html",
      precompress: false,
    }),
  },
};
```

Add prerender option to your root layout:

```javascript
// src/routes/+layout.js
export const prerender = true;
```

This renders all pages at build time. Perfect for blogs, documentation, and marketing sites.

## Environment Variables

SvelteKit has strict rules about environment variables for security.

**Public variables** (exposed to browser):

```bash
# .env
PUBLIC_API_URL=https://api.example.com
PUBLIC_SITE_NAME=My App
```

```javascript
// In any file
import { PUBLIC_API_URL } from "$env/static/public";
```

**Private variables** (server only):

```bash
# .env
DATABASE_URL=postgres://...
API_SECRET=super-secret
```

```javascript
// Only in +page.server.js, +server.js, hooks.server.js
import { DATABASE_URL, API_SECRET } from "$env/static/private";
```

**Dynamic environment variables:**

```javascript
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

// Access at runtime
const dbUrl = env.DATABASE_URL;
const apiUrl = publicEnv.PUBLIC_API_URL;
```

Use `$env/static/*` when possible — it enables dead code elimination.

## Production Checklist

Before deploying:

**1. Set page options:**

```javascript
// src/routes/+layout.js
export const prerender = false; // or true for static
export const ssr = true; // server-side rendering
export const csr = true; // client-side rendering
```

**2. Add error tracking:**

```javascript
// src/hooks.server.js
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "your-sentry-dsn",
  tracesSampleRate: 1.0,
});

export const handleError = Sentry.handleErrorWithSentry();
```

**3. Configure caching:**

```javascript
// src/routes/api/data/+server.js
export function GET() {
  return json(data, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
```

**4. Set up redirects:**

```javascript
// src/hooks.server.js
export function handle({ event, resolve }) {
  // Redirect old URLs
  if (event.url.pathname === "/old-page") {
    return new Response(null, {
      status: 301,
      headers: { location: "/new-page" },
    });
  }

  return resolve(event);
}
```

**5. Add security headers:**

```javascript
// src/hooks.server.js
export async function handle({ event, resolve }) {
  const response = await resolve(event);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
```

## Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --production

ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
```

```yaml
# docker-compose.yml
version: "3"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://...
```

## Preview Before Deploy

```bash
npm run build
npm run preview
```

This runs the production build locally. Test everything before deploying.

## Comparing to Nuxt

Nuxt deployment:

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: "vercel", // or 'netlify', 'cloudflare', etc.
  },
});
```

SvelteKit:

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-vercel";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

Both use adapters/presets. Similar concepts, different config files.

## Deployment Platforms Comparison

| Platform      | Best For     | Edge Support   | Free Tier     |
| ------------- | ------------ | -------------- | ------------- |
| Vercel        | General apps | Yes            | Generous      |
| Netlify       | JAMstack     | Yes            | Generous      |
| Cloudflare    | Edge-first   | Yes (native)   | Very generous |
| Railway       | Node.js apps | No             | Limited       |
| Fly.io        | Containers   | Global regions | Limited       |
| AWS/GCP/Azure | Enterprise   | Depends        | Pay as you go |

## Key Takeaways

- Adapters transform SvelteKit output for specific platforms
- `adapter-auto` works for most serverless platforms
- Use `adapter-static` for fully static sites
- Use `adapter-node` for traditional servers
- Environment variables: `PUBLIC_*` for client, others server-only
- Preview builds locally before deploying
- Add error tracking, caching, and security headers

Next: [Lesson 20: What's Next](/articles/20-whats-next)
