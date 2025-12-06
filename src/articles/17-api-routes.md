---
title: "API Routes"
description: "Build backend endpoints with SvelteKit's +server.js files. Learn to handle HTTP methods, return JSON, and create REST APIs."
tags: ["svelte", "sveltekit", "api"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 18
---

# Lesson 17: API Routes

SvelteKit isn't just for pages. You can build full API endpoints right alongside your frontend. Perfect for JSON APIs, webhooks, and more.

## Creating an Endpoint

Create `+server.js` (or `.ts`) in any route:

```javascript
// src/routes/api/hello/+server.js
export function GET() {
  return new Response("Hello, world!");
}
```

Visit `/api/hello` and you'll see "Hello, world!".

## Returning JSON

```javascript
// src/routes/api/users/+server.js
import { json } from "@sveltejs/kit";

export function GET() {
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  return json(users);
}
```

The `json()` helper sets the correct content type and serializes your data.

## HTTP Methods

Export a function for each method you want to handle:

```javascript
// src/routes/api/posts/+server.js
import { json } from "@sveltejs/kit";
import { db } from "$lib/server/database";

// GET /api/posts
export async function GET() {
  const posts = await db.getAllPosts();
  return json(posts);
}

// POST /api/posts
export async function POST({ request }) {
  const body = await request.json();
  const post = await db.createPost(body);

  return json(post, { status: 201 });
}
```

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.

## Dynamic API Routes

Just like pages, use square brackets:

```javascript
// src/routes/api/posts/[id]/+server.js
import { json, error } from "@sveltejs/kit";
import { db } from "$lib/server/database";

export async function GET({ params }) {
  const post = await db.getPost(params.id);

  if (!post) {
    throw error(404, "Post not found");
  }

  return json(post);
}

export async function PUT({ params, request }) {
  const body = await request.json();
  const post = await db.updatePost(params.id, body);

  if (!post) {
    throw error(404, "Post not found");
  }

  return json(post);
}

export async function DELETE({ params }) {
  const deleted = await db.deletePost(params.id);

  if (!deleted) {
    throw error(404, "Post not found");
  }

  return new Response(null, { status: 204 });
}
```

## Request Data

Access different parts of the request:

```javascript
export async function POST({ request, url, cookies, locals }) {
  // JSON body
  const body = await request.json();

  // Form data
  const formData = await request.formData();

  // Query parameters: /api/search?q=hello
  const query = url.searchParams.get("q");

  // Headers
  const authHeader = request.headers.get("authorization");

  // Cookies
  const session = cookies.get("session");

  // Data from hooks (like user from auth)
  const user = locals.user;

  // ...
}
```

## Response Options

Control response headers and status:

```javascript
import { json } from "@sveltejs/kit";

export function GET() {
  return json(
    { data: "hello" },
    {
      status: 200,
      headers: {
        "cache-control": "max-age=60",
        "x-custom-header": "value",
      },
    }
  );
}
```

Or build responses manually:

```javascript
export function GET() {
  return new Response(JSON.stringify({ data: "hello" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "max-age=60",
    },
  });
}
```

## Streaming Responses

For large data or real-time updates:

```javascript
export function GET() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("First chunk\n");

      setTimeout(() => {
        controller.enqueue("Second chunk\n");
        controller.close();
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain",
    },
  });
}
```

## Error Handling

Throw errors to return error responses:

```javascript
import { error, json } from "@sveltejs/kit";

export async function GET({ params }) {
  const item = await db.getItem(params.id);

  if (!item) {
    throw error(404, {
      message: "Item not found",
      code: "ITEM_NOT_FOUND",
    });
  }

  return json(item);
}
```

Or return error responses directly:

```javascript
export async function POST({ request }) {
  try {
    const body = await request.json();
    // ...
  } catch (e) {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
}
```

## Authentication

Protect endpoints using hooks or checking in the handler:

```javascript
// src/routes/api/admin/+server.js
import { error, json } from "@sveltejs/kit";

export async function GET({ locals }) {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!locals.user.isAdmin) {
    throw error(403, "Forbidden");
  }

  // ... admin-only data
  return json({ secret: "admin stuff" });
}
```

The `locals.user` would be set in a hook (like `hooks.server.js`).

## CORS Headers

Handle cross-origin requests:

```javascript
// src/routes/api/public/+server.js
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export function GET() {
  return json({ data: "publicly accessible" }, { headers: corsHeaders });
}
```

## File Downloads

Serve files:

```javascript
// src/routes/api/download/[filename]/+server.js
import { error } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";

export async function GET({ params }) {
  const filePath = path.join("uploads", params.filename);

  try {
    const file = await fs.readFile(filePath);

    return new Response(file, {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="${params.filename}"`,
      },
    });
  } catch (e) {
    throw error(404, "File not found");
  }
}
```

## Webhooks

Handle incoming webhooks:

```javascript
// src/routes/api/webhooks/stripe/+server.js
import { error, json } from "@sveltejs/kit";
import { STRIPE_WEBHOOK_SECRET } from "$env/static/private";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST({ request }) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw error(400, `Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;
    case "payment_intent.failed":
      await handlePaymentFailure(event.data.object);
      break;
  }

  return json({ received: true });
}
```

## Comparing to Nuxt

Nuxt server routes:

```typescript
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
  return { posts: [] };
});

// server/api/posts.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return { created: body };
});
```

SvelteKit:

```javascript
// src/routes/api/posts/+server.js
import { json } from "@sveltejs/kit";

export function GET() {
  return json({ posts: [] });
}

export async function POST({ request }) {
  const body = await request.json();
  return json({ created: body });
}
```

Nuxt uses file naming for methods. SvelteKit uses exports. Both work well.

## Practical Example: REST API

A complete CRUD API:

```javascript
// src/routes/api/todos/+server.js
import { json } from "@sveltejs/kit";
import { db } from "$lib/server/database";

export async function GET({ url }) {
  const completed = url.searchParams.get("completed");

  let todos = await db.getAllTodos();

  if (completed !== null) {
    const isCompleted = completed === "true";
    todos = todos.filter((t) => t.completed === isCompleted);
  }

  return json(todos);
}

export async function POST({ request }) {
  const { text } = await request.json();

  if (!text?.trim()) {
    return json({ error: "Text is required" }, { status: 400 });
  }

  const todo = await db.createTodo({ text, completed: false });

  return json(todo, { status: 201 });
}
```

```javascript
// src/routes/api/todos/[id]/+server.js
import { json, error } from "@sveltejs/kit";
import { db } from "$lib/server/database";

export async function GET({ params }) {
  const todo = await db.getTodo(params.id);

  if (!todo) throw error(404, "Todo not found");

  return json(todo);
}

export async function PATCH({ params, request }) {
  const updates = await request.json();
  const todo = await db.updateTodo(params.id, updates);

  if (!todo) throw error(404, "Todo not found");

  return json(todo);
}

export async function DELETE({ params }) {
  const deleted = await db.deleteTodo(params.id);

  if (!deleted) throw error(404, "Todo not found");

  return new Response(null, { status: 204 });
}
```

## Key Takeaways

- `+server.js` creates API endpoints
- Export functions for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- Use `json()` helper for JSON responses
- Access params, query strings, headers, cookies, body
- Throw `error()` for error responses
- Use `locals` for auth data from hooks
- Can stream responses and handle files

Next: [Lesson 18: Error Handling](/articles/18-error-handling)
