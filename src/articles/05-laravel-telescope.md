---
title: "Debugging Your API with Laravel Telescope"
description: "Laravel Telescope provides insight into requests, exceptions, and database queries. Essential for debugging your API."
tags: ["laravel", "telescope", "debugging", "api"]
pubDate: "2024-01-05T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 5
---

Laravel Telescope is a first-party debugging assistant that provides insight into requests, exceptions, log entries, database queries, queued jobs, mail, notifications, and more. It's invaluable during API development.

## Installing Telescope

Install Telescope via Composer:

```bash
sail composer require laravel/telescope --dev
```

The `--dev` flag ensures Telescope is only installed in development environments.

Publish the assets and run migrations:

```bash
sail artisan telescope:install
sail artisan migrate
```

## Accessing Telescope

Visit `http://localhost/telescope` in your browser. You'll see a dashboard with tabs for:

- **Requests** - All HTTP requests to your application
- **Commands** - Artisan commands that have been run
- **Schedule** - Scheduled tasks
- **Jobs** - Queued jobs
- **Exceptions** - Exceptions that have been thrown
- **Logs** - Log entries
- **Dumps** - `dump()` output
- **Queries** - Database queries
- **Models** - Model events (created, updated, deleted)
- **Events** - Dispatched events
- **Mail** - Sent emails
- **Notifications** - Sent notifications
- **Cache** - Cache hits and misses
- **Redis** - Redis commands
- **Gates** - Authorization checks
- **Views** - Rendered views

## Useful for API Development

When building an API, the most useful tabs are:

### Requests

See every request that comes in, including:

- Request headers
- Request payload
- Response status and body
- Duration

This is incredibly helpful for debugging authentication issues with Sanctum.

### Queries

View all database queries for each request:

- The raw SQL
- Execution time
- Where it was called from

Great for spotting N+1 query problems.

### Exceptions

See full stack traces for any exceptions, even if they're caught and handled.

## Production Considerations

Telescope should only run in local/development environments. It's automatically disabled in production, but you can configure this in `config/telescope.php`:

```php
'enabled' => env('TELESCOPE_ENABLED', true),
```

And in your `.env`:

```bash
TELESCOPE_ENABLED=false
```

## Pruning Old Entries

Telescope can accumulate a lot of data. Add a scheduled command to prune old entries in `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('telescope:prune --hours=48')->daily();
```

This keeps only the last 48 hours of data.

---

_Next up: A look at the demo application you'll be building._
