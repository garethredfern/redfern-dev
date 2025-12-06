---
title: "Vue Admin Middleware: Role-Based Access Control"
description: "A Vue 3 middleware function with TypeScript to check if the authenticated user has admin privileges before allowing access to admin routes."
tags: ["vue", "middleware", "authorization", "admin", "typescript"]
pubDate: "2024-01-18T10:00:00Z"
series: "Laravel Vue SPA"
seriesOrder: 18
---

The admin middleware checks if the authenticated user has admin privileges. This middleware always runs after the auth middleware, so we can assume the user is already authenticated.

## The Admin Middleware

Create `src/middleware/admin.ts`:

```typescript
import type { MiddlewareContext } from './types'
import { useAuthStore } from '@/stores/auth'

export default function admin({ next }: MiddlewareContext) {
  const authStore = useAuthStore()

  if (authStore.isAdmin) {
    return next()
  }

  // Not an admin, redirect to 404 or dashboard
  return next({ name: 'not-found' })
}
```

This middleware is intentionally simple. By the time it runs, the `auth` middleware has already:

1. Verified the user is authenticated
2. Populated the Pinia store with user details

We just need to check if they have admin privileges using the `isAdmin` computed property from the auth store.

## The Auth Store's isAdmin Property

Make sure your auth store exposes an `isAdmin` computed:

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAdmin = computed(() => user.value?.is_admin ?? false)

  // ... rest of store

  return { user, isAdmin, /* ... */ }
})
```

## Chaining Middleware

The order of middleware matters. Always put `auth` before `admin`:

```typescript
import auth from '@/middleware/auth'
import admin from '@/middleware/admin'

const routes = [
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/UsersView.vue'),
    meta: { middleware: [auth, admin] },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/AdminSettingsView.vue'),
    meta: { middleware: [auth, admin] },
  },
]
```

The execution flow:

1. **auth middleware runs** - Checks if user is logged in, fetches user data if needed
2. **admin middleware runs** - Checks if the now-loaded user has admin privileges
3. **Route loads** - Only if both middleware call `next()`

If you reversed the order (`[admin, auth]`), the admin check would fail because the user data hasn't been loaded yet.

## Handling Non-Admin Users

You have options for what to do when a non-admin tries to access admin routes:

### Option 1: Redirect to 404

```typescript
// User doesn't even know the route exists
return next({ name: 'not-found' })
```

### Option 2: Redirect to Dashboard

```typescript
// User knows the route exists but can't access it
return next({ name: 'dashboard' })
```

### Option 3: Show Forbidden Page

```typescript
// Explicit "you don't have permission" message
return next({ name: 'forbidden' })
```

Create a simple forbidden view:

```vue
<!-- src/views/ForbiddenView.vue -->
<template>
  <div class="text-center py-20">
    <h1 class="text-4xl font-bold text-gray-900">403</h1>
    <p class="mt-4 text-gray-600">You don't have permission to access this page.</p>
    <RouterLink to="/dashboard" class="mt-6 inline-block text-blue-600 hover:underline">
      Return to Dashboard
    </RouterLink>
  </div>
</template>
```

## Conditional UI Rendering

Besides protecting routes, use `isAdmin` to show/hide admin-only UI elements:

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <nav class="flex gap-4">
    <RouterLink to="/dashboard">Dashboard</RouterLink>
    <RouterLink to="/settings">Settings</RouterLink>
    <RouterLink v-if="auth.isAdmin" to="/users">
      Manage Users
    </RouterLink>
  </nav>
</template>
```

## Role-Based Middleware Factory

For more complex role systems, create a middleware factory:

```typescript
// src/middleware/hasRole.ts
import type { MiddlewareContext } from './types'
import { useAuthStore } from '@/stores/auth'

export default function hasRole(role: string) {
  return function ({ next }: MiddlewareContext) {
    const authStore = useAuthStore()

    if (authStore.user?.roles?.includes(role)) {
      return next()
    }

    return next({ name: 'forbidden' })
  }
}
```

Usage:

```typescript
import auth from '@/middleware/auth'
import hasRole from '@/middleware/hasRole'

const routes = [
  {
    path: '/users',
    name: 'users',
    meta: { middleware: [auth, hasRole('admin')] },
  },
  {
    path: '/reports',
    name: 'reports',
    meta: { middleware: [auth, hasRole('manager')] },
  },
]
```

---

*Next up: Building a pagination component with Pinia.*
