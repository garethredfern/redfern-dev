---
title: "Managing Redis Locally For Laravel Projects"
description: "I recently found a neat app for managing your local databases from the makers of TablePlus. Read a short review of it."
tags: ["laravel"]
pubDate: "2020-05-20T09:00:00.000Z"
permalink: "managing-redis-locally-for-laravel-projects"
---

## Managing Redis Locally For Laravel Projects

I recently found a neat app for managing your local databases from the makers of TablePlus. Previously I had just installed Redis and MySQL via Homebrew but with DBngin you can get a GUI to see which services are running.

![DBngin GUI](/images/Screenshot-2020-05-20-at-22.03.53.png)

Once installed you can see all the services you have running and starting/stopping them is a breeze. I have uninstalled both MySQL and Redis from Hombrew with brew remove mysql@5.7 and brew remove redis. Then added them underneath the DBngin services. I did need to restart my Mac just to clear things out but once I did this everything connected as it did before.

Clicking on the arrow next to the service you want to use takes you straight into TablePlus where you can add any required databases. Out of the box the database user will be root and the password is blank. Laravel connects to Redis using the following settings:

```bash
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

I have [previously written](/articles/laravel-valet-installing-phpredis-with-pecl-homebrew) about what you need to get Laravel working with valet and Redis locally and most of this still applies, except you would no longer install Redis via Homebrew (step 1).

## Quick Links

- [TablePlus](https://tableplus.com/)
- [DBngin](https://dbngin.com/)
- [Laravel Valet Installing PHPRedis with PECL/Homebrew](/articles/laravel-valet-installing-phpredis-with-pecl-homebrew)
