---
title: "Laravel Testing Using GitHub Actions With MYSQL"
description: "Using GitHub actions for automating your Laravel tests is fairly straight forward, given the starter workflow they provide."
tags: ["laravel", "testing"]
published: "2020-05-09"
permalink: "laravel-testing-using-github-actions-with-mysql"
---

## Laravel Testing Using GitHub Actions With MYSQL

Using GitHub actions for automating your Laravel tests is fairly straight forward, given the starter workflow they provide. For smaller projects where you are using a sqlite database the starter workflow will probably be all you need. If you are using a MYSQL database with your tests then there is a bit more work required, this post should help guide you.

TLDR: the full code for finished workflow can be found on [GitHub](https://gist.github.com/garethredfern/e348f54621e01791e3a1eceb65d6792e).

> workflows are written in YAML which is a really simple way of formatting that complies with the JSON spec. While it's easy to learn, it does have very strict rules on formatting and indenting. Remember always indent using 2 spaces.

The first thing to add to the workflow is the inclusion of a MQSQL server. Underneath runs-on: ubuntu-latest add the following code, making sure to get your indentation correct:

```yaml
services:
  mysql:
    image: mysql:5.7
    env:
      MYSQL_DATABASE: test_db
      MYSQL_USER: user
      MYSQL_PASSWORD: secret
      MYSQL_ROOT_PASSWORD: secretroot
    ports:
      - 3306
    options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
```

You may also find it useful to add a step which checks to make sure that your connection is working. Underneath steps: right after - uses: actions/checkout@v2 add the following:

```yaml
- name: Verify MySQL connection
  run: |
    mysql --version
    sudo apt-get install -y mysql-client
    mysql --host 127.0.0.1 --port ${{ job.services.mysql.ports['3306'] }} -uuser -psecret -e "SHOW DATABASES"
```

## .env

You will see that as part of the workflow it copies a .env file:

```yaml
run: php -r "file_exists('.env') || copy('.env.example', '.env');"
```

I suggest creating a separate .env that can be publicly read, you don't want to be publishing any secret keys and only a few variables are required. The main one being the `APP_KEY` but if you are using the `MAIL_DRIVER` in your tests then this will also be needed.

```bash
APP_ENV=ci
APP_KEY=

SESSION_DRIVER=array
CACHE_DRIVER=array
QUEUE_DRIVER=sync
MAIL_DRIVER=log
```

## Running The Tests

Finally the test will be run using the MYSQL database that has been created, it is important to add in the connection details for the database:

```bash
- name: Execute tests (Unit and Feature tests) via PHPUnit
      env:
        MYSQL_DATABASE: test_db
        DB_USERNAME: user
        DB_PASSWORD: secret
        DB_PORT: ${{ job.services.mysql.ports[3306] }}
      run: vendor/bin/phpunit
```

Hopefully you have found this useful, the full code can be found up on [GitHub](https://gist.github.com/garethredfern/e348f54621e01791e3a1eceb65d6792e).
