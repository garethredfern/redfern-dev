---
title: "The Easiest Way to Connect SQLite with Svelte for Local Development"
description: "Learn how to set up a local SQLite database with SvelteKit so you can practice data fetching without any external services."
tags: ["svelte", "sveltekit", "sqlite"]
pubDate: "2025-12-08T10:00:00Z"
---

When you're learning data fetching in Svelte, the last thing you want is to set up a Postgres instance, configure cloud databases, or deal with API keys. You just want to write queries and see data appear on screen.

SQLite is perfect for this. It's a database that lives in a single file on your computer. No server to run, no configuration, no accounts to create. Let's set it up with SvelteKit.

## What We're Building

A simple SvelteKit app that:

1. Creates a local SQLite database
2. Seeds it with sample data
3. Fetches that data in a page load function

The whole thing takes about 10 minutes.

## Step 1: Create a SvelteKit Project

If you don't have one already:

```bash
npx sv create my-sqlite-app
cd my-sqlite-app
npm install
```

Choose the minimal template. We don't need anything fancy.

## Step 2: Set Up SQLite

You have two options here depending on your runtime.

### Option A: Using Bun (Recommended)

If you're running SvelteKit with Bun, SQLite is built in. No install required.

```js
// src/lib/db.ts
import { Database } from "bun:sqlite";

const db = new Database("local.db");

export default db;
```

That's the entire setup. Zero dependencies.

### Option B: Using Node

If you're running SvelteKit with Node, install `better-sqlite3`:

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

The first line installs the library. The second adds TypeScript types so your editor can autocomplete database methods.

```js
// src/lib/db.ts
import Database from "better-sqlite3";

const db = new Database("local.db");

export default db;
```

### What's Happening Here

**Short answer:** `new Database('local.db')` creates (or opens) a SQLite database file.

**Long answer:** SQLite stores everything in a single file. When you pass `'local.db'` to the constructor, it looks for that file in your project root. If it doesn't exist, it creates it. If it does exist, it opens it. No connection strings, no ports, no credentials. The file _is_ the database.

Both APIs are nearly identical, so the rest of this tutorial works with either option.

## Step 3: Create a Table and Seed Data

Let's create a setup script that initializes our database. Create `src/lib/db-setup.js`:

```js
// src/lib/db-setup.js
import db from "./db";

// Create the table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if we already have data
const count = db.prepare("SELECT COUNT(*) as count FROM posts").get();

// Only seed if empty
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)");

  insert.run("First Post", "This is my first blog post.");
  insert.run(
    "Learning Svelte",
    "SvelteKit makes data fetching straightforward."
  );
  insert.run(
    "SQLite is Great",
    "No server setup required for local development."
  );

  console.log("Database seeded with sample posts");
}
```

Let's break down what's happening:

- `db.exec()` runs raw SQL. We use it for statements that don't return data, like `CREATE TABLE`
- `CREATE TABLE IF NOT EXISTS` means this script is safe to run multiple times
- `db.prepare()` creates a reusable statement. It's safer and faster than string concatenation
- `.get()` returns a single row, `.run()` executes without returning data
- The `?` placeholders prevent SQL injection. Values get escaped automatically

## Step 4: Run the Setup

Add a script to your `package.json`:

```json
{
  "scripts": {
    "db:setup": "bun src/lib/db-setup.ts"
  }
}
```

Or if using Node:

```json
{
  "scripts": {
    "db:setup": "node src/lib/db-setup.ts"
  }
}
```

Then run it:

```bash
bun run db:setup
# or: npm run db:setup
```

You should see "Database seeded with sample posts" in your terminal. Check your project root—there's now a `local.db` file.

## Step 5: Fetch Data in a SvelteKit Page

Now the fun part. Create a route that loads posts from the database.

Create `src/routes/posts/+page.server.ts`:

```js
// src/routes/posts/+page.server.js
import db from "$lib/db";

export function load() {
  const posts = db
    .prepare("SELECT * FROM posts ORDER BY created_at DESC")
    .all();

  return {
    posts,
  };
}
```

This file runs on the server only (that's what the `.server` in the filename means). It:

1. Imports our database connection
2. Exports a `load` function that SvelteKit calls before rendering the page
3. Queries all posts and returns them

The `$lib` alias points to `src/lib`. SvelteKit sets this up automatically.

## Step 6: Display the Data

Create `src/routes/posts/+page.svelte`:

```svelte
<script>
  let { data } = $props()
</script>

<h1>Posts</h1>

{#each data.posts as post}
  <article>
    <h2>{post.title}</h2>
    <p>{post.content}</p>
    <time>{post.created_at}</time>
  </article>
{/each}
```

The `data` prop comes from your `load` function. SvelteKit passes whatever you return directly to the page component.

- `$props()` is Svelte 5 syntax for receiving props
- `{#each}` loops over the array
- Inside the loop, `post` is a single row from your database

## Step 7: Run It

```bash
bun run dev
# or: npm run dev
```

Visit `http://localhost:5173/posts` and you'll see your posts.

## Adding to .gitignore

You probably don't want to commit your database file:

```
# .gitignore
local.db
```

This keeps your repo clean. The setup script recreates the database on any machine.

## Quick Reference: Common Operations

Here's a cheat sheet. Both `bun:sqlite` and `better-sqlite3` use the same syntax:

```js
// Get all rows
const rows = db.prepare("SELECT * FROM posts").all();

// Get one row
const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(1);

// Insert and get the new ID
const result = db
  .prepare("INSERT INTO posts (title) VALUES (?)")
  .run("New Post");
console.log(result.lastInsertRowid);

// Update
db.prepare("UPDATE posts SET title = ? WHERE id = ?").run("Updated Title", 1);

// Delete
db.prepare("DELETE FROM posts WHERE id = ?").run(1);

// Run multiple statements
db.exec(`
  DELETE FROM posts;
  INSERT INTO posts (title) VALUES ('Fresh Start');
`);
```

Bun also has a shorthand if you prefer:

```js
// bun:sqlite only
db.query("SELECT * FROM posts").all();
db.query("SELECT * FROM posts WHERE id = ?").get(1);
```

```

## Why This Approach Works for Learning

1. **Zero external dependencies.** No database server, no cloud accounts, no API keys
2. **Instant feedback.** Change a query, refresh the page, see results
3. **Real SQL.** These are the same queries you'd write for Postgres or MySQL
4. **Easy reset.** Delete `local.db` and run the setup script again

Once you're comfortable with the data fetching patterns, swapping SQLite for a production database is straightforward. The SvelteKit code stays almost identical—you just change the database driver.

## What's Next

This setup gives you a playground for learning:
- Form submissions that insert data
- Dynamic routes with database lookups
- Server actions that update records

Start small. Add a form that creates new posts. Then add edit and delete. You'll learn more from building than from reading.

---

*Building something with this setup? I'd love to see it. Drop me a link on Twitter.*

**Code examples:** All code is copy-paste ready. If something doesn't work, let me know.
```
