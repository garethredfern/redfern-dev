---
title: "Vue Guest Middleware: Redirecting Logged-In Users"
description: "A Vue 3 middleware function with TypeScript that redirects authenticated users away from guest-only pages like login and register."
tags: ["vue", "middleware", "authentication", "routing", "typescript"]
pubDate: "2024-01-17T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 17
---

The guest middleware prevents authenticated users from accessing pages meant for guests, like login and registration. If a logged-in user tries to visit these pages, they're redirected to the dashboard.

## The Guest Middleware

Create `src/middleware/guest.ts`:

```typescript
import type { MiddlewareContext } from "./types";
import { useAuthStore } from "@/stores/auth";

export default async function guest({ next }: MiddlewareContext) {
  const authStore = useAuthStore();

  // If we already know the user is authenticated, redirect
  if (authStore.user) {
    return next({ name: "dashboard" });
  }

  // Check if we might have a session (user was previously logged in)
  const wasAuthenticated = localStorage.getItem("wasAuthenticated");

  if (wasAuthenticated === "true") {
    // Verify with the API
    await authStore.fetchUser();

    if (authStore.user) {
      return next({ name: "dashboard" });
    }

    // Session expired, clear the flag
    localStorage.removeItem("wasAuthenticated");
  }

  // Not authenticated, allow access to guest page
  return next();
}
```

Let's break down what this middleware does:

1. **Check existing user** - If there's already a user in state, immediately redirect to dashboard

2. **Check localStorage flag** - We use localStorage to track if the user was previously authenticated. This prevents unnecessary API calls on every page load

3. **Verify with API** - If the flag indicates a previous session, we check with the API whether the session is still valid

4. **Redirect or allow** - If authenticated, redirect to dashboard. If not, clear the flag and allow access to the guest page

## Setting the Authentication Flag

Update your auth store to set the flag on login and clear it on logout:

```typescript
// In src/stores/auth.ts
export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);

  async function login(credentials: LoginCredentials) {
    await authService.getCsrfCookie();
    await authService.login(credentials);
    await fetchUser();

    // Set flag for guest middleware
    localStorage.setItem("wasAuthenticated", "true");
  }

  async function logout() {
    await authService.logout();
    user.value = null;

    // Clear flag
    localStorage.removeItem("wasAuthenticated");
  }

  // ... rest of store
});
```

## Using the Middleware

Add to login, register, and other guest-only routes:

```typescript
import guest from "@/middleware/guest";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { middleware: [guest] },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/views/RegisterView.vue"),
    meta: { middleware: [guest] },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/views/ForgotPasswordView.vue"),
    meta: { middleware: [guest] },
  },
];
```

## Simpler Alternative

If you don't need the localStorage optimization, here's a simpler version:

```typescript
import type { MiddlewareContext } from "./types";
import { useAuthStore } from "@/stores/auth";

export default async function guest({ next }: MiddlewareContext) {
  const authStore = useAuthStore();

  // Try to fetch user if we don't have one
  if (!authStore.user) {
    await authStore.fetchUser();
  }

  // If authenticated, redirect to dashboard
  if (authStore.user) {
    return next({ name: "dashboard" });
  }

  // Not authenticated, allow access
  return next();
}
```

This version always checks with the API but is simpler to understand and maintain.

---

_Next up: Building the admin middleware for role-based access._
