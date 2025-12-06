---
title: "Vue Auth Middleware: Protecting Routes"
description: "A Vue 3 middleware function with TypeScript to check if a user is authenticated before displaying a protected route."
tags: ["vue", "middleware", "authentication", "routing", "typescript"]
pubDate: "2024-01-16T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 16
---

The auth middleware checks if a user is authenticated before allowing access to protected routes. If authentication fails, the user is redirected to the login page.

## The Auth Middleware

Create `src/middleware/auth.ts`:

```typescript
import type { MiddlewareContext } from "./types";
import { useAuthStore } from "@/stores/auth";

export default async function auth({ to, next }: MiddlewareContext) {
  const authStore = useAuthStore();

  // If we already have a user, allow access
  if (authStore.user) {
    return next();
  }

  // Try to fetch the user from the API
  await authStore.fetchUser();

  // Check again after API call
  if (authStore.user) {
    return next();
  }

  // Not authenticated, redirect to login with return URL
  return next({
    name: "login",
    query: { redirect: to.fullPath },
  });
}
```

Let's break down what this middleware does:

1. **Access Pinia store** - We get the auth store instance using `useAuthStore()`

2. **Check existing user** - If there's already a user in state, immediately allow access by calling `next()`

3. **Fetch from API** - If no user exists in state, we call `fetchUser()` to check with the Laravel API whether there's a valid session

4. **Verify result** - After the API call, if we now have a user, allow access

5. **Redirect if unauthenticated** - If still no user, redirect to the login page. The `query.redirect` parameter saves the original destination so we can send them there after login

## Using the Middleware

Import and add to any route that requires authentication:

```typescript
import auth from "@/middleware/auth";

const routes = [
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/views/DashboardView.vue"),
    meta: { middleware: [auth] },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/SettingsView.vue"),
    meta: { middleware: [auth] },
  },
];
```

## Handling the Redirect After Login

In your login component, check for the redirect query parameter:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const form = ref({
  email: "",
  password: "",
});

async function handleLogin() {
  await auth.login(form.value);

  // Redirect to original destination or dashboard
  const redirect = route.query.redirect as string;
  router.push(redirect || { name: "dashboard" });
}
</script>
```

## Alternative: Synchronous Check

If you want to avoid the async/await pattern and handle loading states differently:

```typescript
import type { MiddlewareContext } from "./types";
import { useAuthStore } from "@/stores/auth";

export default function auth({ to, next }: MiddlewareContext) {
  const authStore = useAuthStore();

  const loginQuery = {
    name: "login",
    query: { redirect: to.fullPath },
  };

  // If no user and not currently loading, try to fetch
  if (!authStore.user && !authStore.isLoading) {
    authStore.fetchUser().then(() => {
      if (!authStore.user) {
        next(loginQuery);
      } else {
        next();
      }
    });
    return;
  }

  // User exists, allow access
  if (authStore.user) {
    return next();
  }

  // No user and not loading, redirect to login
  return next(loginQuery);
}
```

---

_Next up: Building the guest middleware for login pages._
