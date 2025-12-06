---
title: "Setting Up Vue 3 with Vite and Pinia"
description: "How to set up a Vue 3 SPA with Vite, Pinia, and Vue Router to consume your Laravel API."
tags: ["vue", "vite", "pinia", "spa", "frontend"]
pubDate: "2024-01-03T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 3
---

We'll use Vite to scaffold our Vue 3 project. Vite provides lightning-fast hot module replacement and optimized builds.

## Create the Project

```bash
npm create vue@latest laravel-vue
```

When prompted, select:

- ✅ TypeScript (recommended, but optional)
- ✅ Vue Router
- ✅ Pinia
- ✅ ESLint
- ✅ Prettier

```bash
cd laravel-vue
npm install
```

## Install Additional Dependencies

We need Axios for API requests:

```bash
npm install axios
```

## Configure Environment Variables

Create a `.env` file in your Vue project root:

```bash
VITE_API_URL=http://localhost
```

Vite exposes environment variables prefixed with `VITE_` to your application.

## Configure Axios

Create `src/services/api.ts`:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Required for Sanctum cookies
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
```

The `withCredentials: true` setting is critical - it allows cookies to be sent with cross-origin requests, which Sanctum needs for session-based authentication.

## Configure Pinia Store

Pinia is the official state management solution for Vue 3, replacing Vuex. Create `src/stores/auth.ts`:

```typescript
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_admin?: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.is_admin ?? false);
  const isVerified = computed(() => !!user.value?.email_verified_at);

  async function fetchUser() {
    try {
      isLoading.value = true;
      const response = await api.get("/api/user");
      user.value = response.data;
    } catch (e) {
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: { email: string; password: string }) {
    error.value = null;
    try {
      // Get CSRF cookie first
      await api.get("/sanctum/csrf-cookie");
      // Then login
      await api.post("/login", credentials);
      await fetchUser();
    } catch (e: any) {
      error.value = e.response?.data?.message || "Login failed";
      throw e;
    }
  }

  async function logout() {
    await api.post("/logout");
    user.value = null;
  }

  async function register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    await api.get("/sanctum/csrf-cookie");
    await api.post("/register", data);
    await fetchUser();
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isVerified,
    fetchUser,
    login,
    logout,
    register,
  };
});
```

## Configure Vue Router

Update `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { guest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { guest: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Try to fetch user if not loaded
  if (!auth.user && !auth.isLoading) {
    await auth.fetchUser();
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: "dashboard" };
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
});

export default router;
```

## Start Development Server

```bash
npm run dev
```

Your Vue app will be available at `http://localhost:5173`.

## Project Structure

Your project should now look like this:

```
src/
├── assets/
├── components/
├── router/
│   └── index.ts
├── services/
│   └── api.ts
├── stores/
│   └── auth.ts
├── views/
│   ├── HomeView.vue
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   └── DashboardView.vue
├── App.vue
└── main.ts
```

---

_Next up: Testing your API endpoints with Insomnia or Postman._
