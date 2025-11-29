---
title: "Laravel Valet Installing PHPRedis with PECL/Homebrew"
description: "This post was written 3/2/2020 and explains how I got Redis working using Laravel Valet."
tags: ["laravel"]
pubDate: "2020-02-03T09:00:00.000Z"
permalink: "laravel-valet-installing-phpredis-with-pecl-homebrew"
---

## Laravel Valet Installing PHPRedis with PECL/Homebrew

This post was written 3/2/2020 and explains how I got Redis working using Laravel Valet. Valet was a clean install following the instructions on the [Laravel site](https://laravel.com/docs/6.x/valet#installation).

I couldn't get Predis to work (installed with composer) and the Laravel instructions suggest the following:

> Before using Redis with Laravel, we encourage you to install and use the PhpRedis PHP extension via PECL. The extension is more complex to install but may yield better performance for applications that make heavy use of Redis.

Here are the steps I followed:

1. Install Redis via Homebrew `brew install redis`
2. The PHP version that you installed via the Laravel Valet instructions comes with PECL run `pecl install redis`
3. Adjust your PHP configuration contained in `/usr/local/etc/php/7.4.2` - remove the line `extension="redis.so"` from the top of `php.ini` (your version of PHP may be different).
4. Create `/usr/local/etc/php/7.4.2/conf.d/ext-redis.ini` and add:

```bash
[redis]
extension="/usr/local/Cellar/php/7.4.2/pecl/20190902/redis.so"
```

You will need to change `20190902` in the above path to the file directory number that you have on your file system, to find this navigate to `/usr/local/Cellar/php/7.4.2/pecl/` and type `ls` this will show you the file path. Save the `ext-redis.ini` file and then restart Valet with `valet restart` and start and stop Redis with brew services using `brew services stop redis` and `brew services start redis`.

You should now be able to run Laravel Valet with Redis if you have [Horizon installed](https://laravel.com/docs/6.x/horizon#installation) then run `php artisan horizon` and check your queues run successfully.
