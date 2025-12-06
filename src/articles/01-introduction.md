---
title: "Building a Laravel API with Vue SPA: Introduction"
description: "A step by step guide on how to build a Laravel 11 API with a Vue 3 SPA to consume its data using Sanctum and Fortify."
tags: ["laravel", "vue", "api", "sanctum", "spa"]
pubDate: "2024-01-01T10:00:00Z"
series: "Laravel Vue SPA"
seriesOrder: 1
---

If you want to build a completely separate SPA that consumes a Laravel API, this series provides everything you need to get set up with modern tooling.

We'll be using:
- **Laravel 11** with Sanctum for API authentication
- **Vue 3** with the Composition API
- **Pinia** for state management (the official replacement for Vuex)
- **Vite** for fast development builds
- **TypeScript** support (optional but recommended)

If you would like to hear an excellent explanation from Taylor on how Sanctum and Fortify came about, I highly recommend listening to his [podcast episode](https://blog.laravel.com/laravel-snippet-25-ecosystem-discussion-auth-recap-passport-sanctum).

The example project files can be found on GitHub:

- [Laravel API](https://github.com/garethredfern/laravel-api)
- [Vue SPA](https://github.com/garethredfern/laravel-vue)

## What You'll Build

By the end of this series, you'll have:

1. A Laravel API with full authentication (login, register, password reset, email verification)
2. A Vue 3 SPA with protected routes and role-based access
3. File upload functionality with cloud storage
4. Reusable middleware patterns for route protection
5. Pagination and error handling patterns

## Prerequisites

- Basic knowledge of PHP and Laravel
- Familiarity with JavaScript and Vue.js
- Docker installed (we'll use Laravel Sail)
- Node.js 18+ installed

## Questions

If you have any questions please feel free to [start a discussion](https://github.com/garethredfern/laravelvue-spa/discussions) over on GitHub.

---

*Next up: Setting up the Laravel API with Sanctum and Fortify.*
