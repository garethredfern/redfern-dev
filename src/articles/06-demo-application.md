---
title: "The Demo Application"
description: "Overview of the demo application you'll be building - a Vue 3 SPA with Laravel 11 API authentication."
tags: ["vue", "laravel", "demo", "spa"]
pubDate: "2024-01-06T10:00:00Z"
series: "Laravel Vue SPA"
seriesOrder: 6
---

To see what you'll be building, clone and run the example projects locally.

## Project Repositories

- [Laravel API](https://github.com/garethredfern/laravel-api)
- [Vue SPA](https://github.com/garethredfern/laravel-vue)

## Features Demonstrated

The demo application includes:

### Authentication
- User registration with email verification
- Login/logout with session-based authentication
- Password reset via email
- "Remember me" functionality

### User Management
- Update profile information
- Change password
- Upload avatar image

### Authorization
- Role-based access control (admin vs regular user)
- Protected routes that require authentication
- Admin-only routes and content

### API Features
- RESTful API design
- API resources for consistent JSON responses
- Pagination
- Error handling

## Running Locally

### 1. Laravel API

```bash
git clone https://github.com/garethredfern/laravel-api.git
cd laravel-api
cp .env.example .env
composer install
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

### 2. Vue SPA

```bash
git clone https://github.com/garethredfern/laravel-vue.git
cd laravel-vue
cp .env.example .env
npm install
npm run dev
```

### 3. Test It Out

1. Visit `http://localhost:5173`
2. Register a new account
3. Check your email (or Mailpit at `http://localhost:8025`) for verification
4. Log in and explore the dashboard

## Default Test User

If you ran the database seeder, you can log in with:

- **Email:** test@example.com
- **Password:** password

---

*Next up: Setting up authentication in the Laravel API.*
