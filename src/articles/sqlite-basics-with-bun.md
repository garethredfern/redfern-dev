---
title: "SQLite Basics: Learn to Write and Query a Database with Bun"
description: "A practical introduction to SQLite using Bun's built-in database—create tables, insert data, and write queries from scratch."
tags: ["sqlite", "bun", "database", "tutorial", "beginner"]
pubDate: "2025-12-08T11:00:00Z"
---

If you've never worked with a database before, SQLite is the perfect starting point. No servers, no configuration, no accounts. Just a file on your computer that stores your data.

Bun makes this even simpler—SQLite is built in. Let's learn the fundamentals by building a simple task manager.

## Setting Up

Create a new file called `learn-sqlite.js`. That's all you need.

```js
// learn-sqlite.js
import { Database } from "bun:sqlite";

const db = new Database("tasks.db");
```

Run it once with `bun learn-sqlite.js` and you'll see a new file called `tasks.db` appear in your folder. That file _is_ your database.

## Creating a Table

A database stores data in tables. Think of a table like a spreadsheet—rows and columns. Before you can store anything, you need to define what columns your table has.

```js
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
```

Let's break down each line:

- `CREATE TABLE IF NOT EXISTS tasks` — Create a table called "tasks", but only if it doesn't already exist. This makes the script safe to run multiple times.
- `id INTEGER PRIMARY KEY AUTOINCREMENT` — Every row gets a unique number. The database handles this automatically.
- `title TEXT NOT NULL` — A text column that can't be empty. `NOT NULL` means you must provide a value.
- `completed INTEGER DEFAULT 0` — SQLite doesn't have booleans, so we use 0 for false and 1 for true. Defaults to 0 (not completed).
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP` — Automatically stores when the row was created.

## Inserting Data

Now let's add some tasks.

```js
// Insert a single task
db.run(`INSERT INTO tasks (title) VALUES ('Learn SQLite basics')`);
```

The `INSERT INTO` statement adds a new row. We only specify `title` because the other columns have defaults or auto-generate.

For inserting with variables, use a prepared statement:

```js
const insert = db.prepare("INSERT INTO tasks (title) VALUES (?)");

insert.run("Build a project with Bun");
insert.run("Write a blog post");
insert.run("Share on Twitter");
```

The `?` is a placeholder. When you call `.run()`, your value gets safely inserted there. This prevents SQL injection—a security vulnerability where malicious input could mess with your database.

**Short answer:** Always use `?` placeholders instead of string concatenation.

**Long answer:** If you wrote `INSERT INTO tasks (title) VALUES ('${userInput}')` and someone entered `'); DROP TABLE tasks; --` as their input, they could delete your entire table. Placeholders escape special characters automatically, making this impossible.

## Reading Data

### Get All Rows

```js
const allTasks = db.query("SELECT * FROM tasks").all();
console.log(allTasks);
```

Output:

```js
[
  {
    id: 1,
    title: "Learn SQLite basics",
    completed: 0,
    created_at: "2025-12-08 10:30:00",
  },
  {
    id: 2,
    title: "Build a project with Bun",
    completed: 0,
    created_at: "2025-12-08 10:30:01",
  },
  {
    id: 3,
    title: "Write a blog post",
    completed: 0,
    created_at: "2025-12-08 10:30:01",
  },
  {
    id: 4,
    title: "Share on Twitter",
    completed: 0,
    created_at: "2025-12-08 10:30:01",
  },
];
```

- `SELECT *` means "get all columns"
- `FROM tasks` specifies which table
- `.all()` returns an array of all matching rows

### Get Specific Columns

You don't always need everything:

```js
const titles = db.query("SELECT id, title FROM tasks").all();
console.log(titles);
```

Output:

```js
[
  { id: 1, title: "Learn SQLite basics" },
  { id: 2, title: "Build a project with Bun" },
  // ...
];
```

### Get One Row

When you only need a single result:

```js
const task = db.query("SELECT * FROM tasks WHERE id = ?").get(1);
console.log(task);
```

Output:

```js
{ id: 1, title: 'Learn SQLite basics', completed: 0, created_at: '2025-12-08 10:30:00' }
```

- `WHERE id = ?` filters to rows matching that condition
- `.get()` returns a single object (or `null` if nothing matches)

## Filtering with WHERE

The `WHERE` clause is how you filter data. Here are common patterns:

```js
// Exact match
db.query("SELECT * FROM tasks WHERE completed = ?").all(0);

// Text search (case-insensitive with LIKE)
db.query("SELECT * FROM tasks WHERE title LIKE ?").all("%blog%");

// Multiple conditions
db.query("SELECT * FROM tasks WHERE completed = ? AND id > ?").all(0, 2);

// Either condition
db.query("SELECT * FROM tasks WHERE title LIKE ? OR title LIKE ?").all(
  "%Bun%",
  "%SQL%"
);
```

The `%` in `LIKE` is a wildcard meaning "any characters". So `'%blog%'` matches any title containing "blog".

## Updating Data

Mark a task as completed:

```js
db.run("UPDATE tasks SET completed = 1 WHERE id = ?", [1]);
```

- `UPDATE tasks` specifies the table
- `SET completed = 1` is what we're changing
- `WHERE id = ?` ensures we only update one specific row

**Important:** Always include a `WHERE` clause with `UPDATE`. Without it, you'd update every row in the table.

Let's verify it worked:

```js
const updated = db.query("SELECT * FROM tasks WHERE id = 1").get();
console.log(updated);
// { id: 1, title: 'Learn SQLite basics', completed: 1, created_at: '...' }
```

## Deleting Data

Remove a task:

```js
db.run("DELETE FROM tasks WHERE id = ?", [4]);
```

Same warning as `UPDATE`—always use `WHERE` unless you want to delete everything.

To delete all completed tasks:

```js
db.run("DELETE FROM tasks WHERE completed = 1");
```

## Sorting Results

Order your results with `ORDER BY`:

```js
// Newest first
db.query("SELECT * FROM tasks ORDER BY created_at DESC").all();

// Alphabetical by title
db.query("SELECT * FROM tasks ORDER BY title ASC").all();

// Incomplete tasks first, then by date
db.query("SELECT * FROM tasks ORDER BY completed ASC, created_at DESC").all();
```

- `ASC` = ascending (A-Z, 0-9, oldest first)
- `DESC` = descending (Z-A, 9-0, newest first)

## Limiting Results

Get just the first few rows:

```js
// Get the 5 most recent tasks
db.query("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5").all();

// Skip the first 5, then get 5 more (for pagination)
db.query("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5 OFFSET 5").all();
```

## Counting Rows

```js
const result = db.query("SELECT COUNT(*) as total FROM tasks").get();
console.log(result.total); // 3

// Count with a condition
const incomplete = db
  .query("SELECT COUNT(*) as total FROM tasks WHERE completed = 0")
  .get();
console.log(incomplete.total); // 2
```

The `as total` part gives the count a name so you can access it as `result.total`.

## Putting It All Together

Here's a complete script that demonstrates everything:

```js
// learn-sqlite.js
import { Database } from "bun:sqlite";

const db = new Database("tasks.db");

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Clear existing data (for clean demo runs)
db.run("DELETE FROM tasks");

// Insert tasks
const insert = db.prepare("INSERT INTO tasks (title) VALUES (?)");
insert.run("Learn SQLite basics");
insert.run("Build a project with Bun");
insert.run("Write a blog post");
insert.run("Share on Twitter");

// Mark first task complete
db.run("UPDATE tasks SET completed = 1 WHERE id = 1");

// Query examples
console.log("All tasks:");
console.log(db.query("SELECT * FROM tasks").all());

console.log("\nIncomplete tasks:");
console.log(db.query("SELECT * FROM tasks WHERE completed = 0").all());

console.log("\nTask count:");
console.log(db.query("SELECT COUNT(*) as total FROM tasks").get());

console.log("\nNewest task:");
console.log(
  db.query("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 1").get()
);
```

Run it with:

```bash
bun learn-sqlite.js
```

## Cheat Sheet

Save this for quick reference:

| Operation    | SQL                                            |
| ------------ | ---------------------------------------------- |
| Create table | `CREATE TABLE IF NOT EXISTS name (columns...)` |
| Insert       | `INSERT INTO table (cols) VALUES (?)`          |
| Select all   | `SELECT * FROM table`                          |
| Select one   | `SELECT * FROM table WHERE id = ?` + `.get()`  |
| Filter       | `SELECT * FROM table WHERE column = ?`         |
| Update       | `UPDATE table SET column = ? WHERE id = ?`     |
| Delete       | `DELETE FROM table WHERE id = ?`               |
| Sort         | `SELECT * FROM table ORDER BY column DESC`     |
| Limit        | `SELECT * FROM table LIMIT 10`                 |
| Count        | `SELECT COUNT(*) as total FROM table`          |

## What's Next

You now know enough SQL to build real things. Some ideas to practice:

- Add a `priority` column and sort by it
- Create a second table for categories and link them
- Build a CLI tool that manages tasks from the terminal
- Connect this to a SvelteKit app (see my post on that)

The syntax you've learned here works in PostgreSQL, MySQL, and every other SQL database. SQLite is just the easiest way to learn it.

---

_Questions? Something not clicking? Let me know and I'll clarify._

**Code examples:** All code is copy-paste ready. Run with `bun learn-sqlite.js`.
