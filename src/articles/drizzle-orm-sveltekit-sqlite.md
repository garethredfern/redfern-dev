---
title: "Adding Drizzle ORM to Your SvelteKit + SQLite Setup"
description: "Level up from raw SQL to type-safe queries with Drizzle—the lightweight ORM that doesn't hide the SQL you've learned."
tags: ["drizzle", "sqlite", "sveltekit", "database"]
pubDate: "2025-12-08T12:00:00Z"
---

You've learned raw SQL. You can write queries, insert data, filter results. Now your `+page.server.js` files are filling up with string templates and it's getting repetitive.

Drizzle sits in the sweet spot between raw SQL and heavy ORMs like Prisma. It gives you type safety and cleaner syntax without hiding what's actually happening. The queries you write look like SQL, just in JavaScript.

Let's add it to a SvelteKit + Bun + SQLite project.

## Install Drizzle

```bash
bun add drizzle-orm
bun add -D drizzle-kit
```

- `drizzle-orm` is the runtime library
- `drizzle-kit` is for migrations and schema management (dev dependency)

## Define Your Schema

Instead of writing `CREATE TABLE` statements, you define tables in JavaScript. Create `src/lib/schema.js`:

```js
// src/lib/schema.js
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  published: integer("published").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
```

Let's break this down:

- `sqliteTable('posts', {...})` defines a table named "posts"
- `integer('id')` creates a column—the string `'id'` is the actual column name in SQLite
- `.primaryKey({ autoIncrement: true })` makes it auto-increment
- `.notNull()` means the column can't be empty
- `.default(0)` sets a default value

**Short answer:** This is the same table structure you'd write in SQL, just as JavaScript objects.

**Long answer:** Drizzle uses this schema for two things. First, it generates the actual SQL to create your tables. Second, it infers TypeScript types so your queries are type-safe. When you select from `posts`, your editor knows the result has `id`, `title`, `content`, etc.

## Set Up the Database Connection

Create `src/lib/db.js`:

```js
// src/lib/db.js
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema.js";

const sqlite = new Database("local.db");
const db = drizzle(sqlite, { schema });

export default db;
```

We pass the schema to `drizzle()` so it knows about our tables. This enables the relational query API we'll use later.

## Create the Tables

You have two options here.

### Option A: Push (Quick and Simple)

For local development, just push your schema directly:

```bash
bunx drizzle-kit push
```

This reads your schema and creates/updates tables to match. Fast, no migration files.

You'll need a config file. Create `drizzle.config.js`:

```js
// drizzle.config.js
export default {
  schema: "./src/lib/schema.js",
  driver: "bun:sqlite",
  dbCredentials: {
    url: "local.db",
  },
};
```

### Option B: Migrations (Production-Ready)

For production, you want migration files that track changes:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

This creates SQL files in a `drizzle` folder. Better for teams and deployments, but overkill while learning.

Stick with `push` for now.

## Writing Queries

Here's where Drizzle shines. Your queries look like SQL but with full autocomplete.

### Select All

```js
// Raw SQL
db.query("SELECT * FROM posts").all();

// Drizzle
import { posts } from "$lib/schema.js";
db.select().from(posts).all();
```

### Select Specific Columns

```js
// Raw SQL
db.query("SELECT id, title FROM posts").all();

// Drizzle
db.select({ id: posts.id, title: posts.title }).from(posts).all();
```

### Filter with WHERE

```js
import { eq, like, and, gt } from "drizzle-orm";

// Raw SQL
db.query("SELECT * FROM posts WHERE published = 1").all();

// Drizzle
db.select().from(posts).where(eq(posts.published, 1)).all();

// Multiple conditions
db.select()
  .from(posts)
  .where(and(eq(posts.published, 1), gt(posts.id, 5)))
  .all();

// LIKE search
db.select().from(posts).where(like(posts.title, "%svelte%")).all();
```

The `eq`, `like`, `and`, `gt` functions map directly to SQL operators. You're still thinking in SQL, just with type checking.

### Insert

```js
// Raw SQL
db.run("INSERT INTO posts (title, content) VALUES (?, ?)", [
  "My Post",
  "Content here",
]);

// Drizzle
db.insert(posts).values({ title: "My Post", content: "Content here" }).run();

// Insert multiple
db.insert(posts)
  .values([
    { title: "First Post", content: "Hello" },
    { title: "Second Post", content: "World" },
  ])
  .run();
```

### Update

```js
// Raw SQL
db.run("UPDATE posts SET published = 1 WHERE id = ?", [1]);

// Drizzle
db.update(posts).set({ published: 1 }).where(eq(posts.id, 1)).run();
```

### Delete

```js
// Raw SQL
db.run("DELETE FROM posts WHERE id = ?", [1]);

// Drizzle
db.delete(posts).where(eq(posts.id, 1)).run();
```

### Order and Limit

```js
import { desc, asc } from "drizzle-orm";

// Newest first, limit 10
db.select().from(posts).orderBy(desc(posts.createdAt)).limit(10).all();
```

## Using It in SvelteKit

Here's a complete example. Create `src/routes/posts/+page.server.js`:

```js
// src/routes/posts/+page.server.js
import db from "$lib/db.js";
import { posts } from "$lib/schema.js";
import { eq, desc } from "drizzle-orm";

export function load() {
  const allPosts = db
    .select()
    .from(posts)
    .where(eq(posts.published, 1))
    .orderBy(desc(posts.createdAt))
    .all();

  return { posts: allPosts };
}
```

And `src/routes/posts/+page.svelte`:

```svelte
<script>
  let { data } = $props()
</script>

<h1>Posts</h1>

{#each data.posts as post}
  <article>
    <h2>{post.title}</h2>
    <p>{post.content}</p>
  </article>
{/each}
```

## Form Actions with Drizzle

Handle form submissions in `+page.server.js`:

```js
// src/routes/posts/+page.server.js
import db from "$lib/db.js";
import { posts } from "$lib/schema.js";
import { eq, desc } from "drizzle-orm";

export function load() {
  const allPosts = db.select().from(posts).orderBy(desc(posts.createdAt)).all();

  return { posts: allPosts };
}

export const actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get("title");
    const content = formData.get("content");

    db.insert(posts).values({ title, content }).run();

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));

    db.delete(posts).where(eq(posts.id, id)).run();

    return { success: true };
  },
};
```

And the form:

```svelte
<script>
  let { data } = $props()
</script>

<h1>Posts</h1>

<form method="POST" action="?/create">
  <input name="title" placeholder="Title" required />
  <textarea name="content" placeholder="Content"></textarea>
  <button type="submit">Add Post</button>
</form>

{#each data.posts as post}
  <article>
    <h2>{post.title}</h2>
    <p>{post.content}</p>
    <form method="POST" action="?/delete">
      <input type="hidden" name="id" value={post.id} />
      <button type="submit">Delete</button>
    </form>
  </article>
{/each}
```

## When to Use Drizzle vs Raw SQL

**Stick with raw SQL when:**

- You're still learning SQL fundamentals
- Writing one-off scripts or queries
- Performance is critical (raw is slightly faster)

**Use Drizzle when:**

- You want autocomplete and type safety
- Your app has multiple tables with relationships
- You're tired of writing the same query patterns
- You want to catch typos at build time, not runtime

## Cheat Sheet: Raw SQL → Drizzle

| Operation      | Raw SQL                                | Drizzle                                                       |
| -------------- | -------------------------------------- | ------------------------------------------------------------- |
| Select all     | `SELECT * FROM posts`                  | `db.select().from(posts)`                                     |
| Select columns | `SELECT id, title FROM posts`          | `db.select({ id: posts.id, title: posts.title }).from(posts)` |
| Where          | `WHERE published = 1`                  | `.where(eq(posts.published, 1))`                              |
| And            | `WHERE a = 1 AND b = 2`                | `.where(and(eq(a, 1), eq(b, 2)))`                             |
| Like           | `WHERE title LIKE '%x%'`               | `.where(like(posts.title, '%x%'))`                            |
| Order          | `ORDER BY created_at DESC`             | `.orderBy(desc(posts.createdAt))`                             |
| Limit          | `LIMIT 10`                             | `.limit(10)`                                                  |
| Insert         | `INSERT INTO posts (title) VALUES (?)` | `db.insert(posts).values({ title })`                          |
| Update         | `UPDATE posts SET x = ? WHERE id = ?`  | `db.update(posts).set({ x }).where(eq(posts.id, id))`         |
| Delete         | `DELETE FROM posts WHERE id = ?`       | `db.delete(posts).where(eq(posts.id, id))`                    |

## What's Next

You now have a proper database layer for your SvelteKit app. Some things to try:

- Add a second table (categories, users, tags) and create relationships
- Use Drizzle's relational queries for joins
- Add Drizzle Studio (`bunx drizzle-kit studio`) to browse your data visually

The SQL you learned isn't wasted—Drizzle just wraps it in a nicer API. You can always drop down to raw queries when needed.

---

_This is part of my series on building with SvelteKit + Bun. Next up: adding relationships between tables._

**Code examples:** All code is copy-paste ready. Questions? Let me know.
