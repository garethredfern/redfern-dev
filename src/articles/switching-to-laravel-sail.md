---
title: "Switching to Laravel Sail"
description: "A quick write up for using Laravel Sail, with a solution to the set-up errors you can run into."
tags: ["laravel"]
pubDate: "2020-12-21T09:00:00.000Z"
link: "switching-to-laravel-sail"
---

## Switching to Laravel Sail

Recently, Taylor shipped another Laravel package called [Sail](https://laravel.com/docs/8.x/sail). The idea behind Sail is to provide an effortless Docker install with no Docker experience required. Helping to speed up Laravel development, reducing the barrier to entry for getting a Laravel project set up. For the last few years I have been using [Valet](https://laravel.com/docs/8.x/valet), which has worked extremely well. However, I have been keen to get things moved across to Docker for a while now.

One thing that Valet didn’t provide was Redis. I wrote an [article](/articles/laravel-valet-installing-phpredis-with-pecl-homebrew) on this. With Sail this is no longer an issue. While this is not necessarily a strong reason to move from Valet, it certainly helps make your environment easier to set up.

Another advantage with Sail is the Laravel app container uses a [Docker volume](https://docs.docker.com/storage/volumes/) so the data stored in your database is persisted even when stopping and restarting your containers.

Sail also ships with Mailhog pre-configured, allowing for easily testing sending mail.

### A Couple of Gotchas

After following the set up instructions, I tried to run my migrations and received the following error:

```bash
Illuminate\Database\QueryException

SQLSTATE[HY000] [2002] Connection refused (SQL: SHOW FULL TABLES WHERE table_type = 'BASE TABLE')
```

What this means is that the database connection has not been made when running the migrations. To solve this all you need to do is change the following in your `.env` file:

```bash
DB_HOST=127.0.0.1
```

Remove `127.0.0.1` adding the name of the mysql service in the `docker-composer.yml` file:

```bash
DB_HOST=mysql
```

The same applies to your Redis host, change the following from:

```bash
REDIS_HOST=127.0.0.1
```

To this:

```bash
REDIS_HOST=redis
```

I would imagine the same will be true for setting up Memcached, but I haven’t tested it as yet. The Docker service name to use in your .env file would be `memcached` rather than `127.0.0.1`.

I think its well worth giving this Docker set up a try. For me, the main reason is not having to worry about having the correct versions of PHP, MYSQL, Redis etc. stored on my local machine. If something breaks you can destroy the container build a new one, everything is self-contained away from your local machine. It will also make sharing set-ups quick and easy between other developers no matter what OS they use. Finally, if you are on a Mac don’t be worried about things running slow or hogging memory. I have had no issues so far.
