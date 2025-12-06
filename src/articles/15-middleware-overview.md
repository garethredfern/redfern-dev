---
title: "Vue Middleware Pipelines: An Overview"
description: "Adding middleware to a Vue 3 SPA with TypeScript keeps code clean and provides a way to have multiple functions run before a route loads."
tags: ["vue", "middleware", "routing", "typescript", "patterns"]
pubDate: "2024-01-15T10:00:00Z"
series: "Laravel Vue SPA"
seriesOrder: 15
---

As your app grows, you'll need a way to control what happens before a route loads. The basic approach using `beforeEach` with `meta.requiresAuth` works well for simple authentication checks, but what happens when you need multiple checks? A user might need to be authenticated AND be an admin to access certain routes.

## The Middleware Pattern

Instead of cramming all logic into a single `beforeEach` hook, we can use the middleware design pattern. This lets us chain multiple middleware functions together while keeping the router code clean.

## Setting Up Middleware with Vue 3 and Pinia

First, let's define the types. Create `src/middleware/types.ts`:

```typescript
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

export interface MiddlewareContext {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}

export type Middleware = (context: MiddlewareContext) => void | Promise<void>
```

## The Middleware Pipeline

Create `src/middleware/pipeline.ts`:

```typescript
import type { MiddlewareContext, Middleware } from './types'

export function middlewarePipeline(
  context: MiddlewareContext,
  middleware: Middleware[],
  index: number
): () => void {
  const nextMiddleware = middleware[index]

  if (!nextMiddleware) {
    return context.next
  }

  return () => {
    nextMiddleware({
      ...context,
      next: middlewarePipeline(context, middleware, index + 1),
    })
  }
}
```

Breaking down the `middlewarePipeline` function:

1. **Parameters** - Receives the context, middleware array, and current index
2. **Get next middleware** - Retrieves the next middleware function from the array
3. **Base case** - If no more middleware exists, return the original `next` function to load the route
4. **Recursive call** - Returns a function that calls the next middleware, passing in context with an updated `next` that points to the following middleware

## Router Configuration

Update `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { middlewarePipeline } from '@/middleware/pipeline'
import type { Middleware } from '@/middleware/types'
import auth from '@/middleware/auth'
import guest from '@/middleware/guest'
import admin from '@/middleware/admin'

// Extend route meta type
declare module 'vue-router' {
  interface RouteMeta {
    middleware?: Middleware[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { middleware: [guest] },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { middleware: [guest] },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { middleware: [auth] },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { middleware: [auth] },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { middleware: [auth, admin] },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const middleware = to.meta.middleware

  // No middleware required, continue
  if (!middleware || middleware.length === 0) {
    return next()
  }

  const context = { to, from, next }

  // Start the middleware pipeline
  middleware[0]({
    ...context,
    next: middlewarePipeline(context, middleware, 1),
  })
})

export default router
```

## How It Works

When a user navigates to `/users`, here's what happens:

1. **Router intercepts** - `beforeEach` catches the navigation
2. **Middleware array found** - `[auth, admin]` from route meta
3. **First middleware runs** - `auth` checks authentication
4. **Pipeline continues** - If `auth` calls `next()`, the pipeline runs `admin`
5. **Admin check** - `admin` verifies the user has admin privileges
6. **Route loads** - If both pass, the original `next()` is called

The key insight is that each middleware controls whether to continue by calling `next()`. If a middleware doesn't call `next()` (or redirects instead), the pipeline stops.

## Benefits of This Pattern

1. **Separation of concerns** - Each middleware handles one responsibility
2. **Reusability** - Middleware functions can be combined in different ways
3. **Testability** - Each middleware can be unit tested independently
4. **Type safety** - TypeScript ensures correct context passing
5. **Clean routes** - Route definitions clearly show their requirements

---

*Next up: Building the auth middleware function.*
