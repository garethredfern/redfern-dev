---
title: "Vue 3 SPA Authentication with Sanctum"
description: "How to set up full authentication in a Vue 3 SPA using Laravel Sanctum, Pinia, and the Composition API."
tags: ["vue", "authentication", "sanctum", "pinia", "composition-api"]
pubDate: "2024-01-08T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 8
---

Now let's build out the authentication UI in our Vue 3 SPA using the Composition API and Pinia.

## Auth Service

First, let's create a dedicated auth service. Create `src/services/auth.ts`:

```typescript
import api from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_admin?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  async getCsrfCookie() {
    await api.get("/sanctum/csrf-cookie");
  },

  async login(credentials: LoginCredentials) {
    await this.getCsrfCookie();
    return api.post("/login", credentials);
  },

  async register(data: RegisterData) {
    await this.getCsrfCookie();
    return api.post("/register", data);
  },

  async logout() {
    return api.post("/logout");
  },

  async getUser() {
    return api.get<User>("/api/user");
  },

  async forgotPassword(email: string) {
    await this.getCsrfCookie();
    return api.post("/forgot-password", { email });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    await this.getCsrfCookie();
    return api.post("/reset-password", data);
  },

  async updateProfile(data: { name: string; email: string }) {
    return api.put("/user/profile-information", data);
  },

  async updatePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return api.put("/user/password", data);
  },

  async sendVerificationEmail() {
    return api.post("/email/verification-notification");
  },
};
```

## Auth Store with Pinia

Update `src/stores/auth.ts`:

```typescript
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  authService,
  type User,
  type LoginCredentials,
  type RegisterData,
} from "@/services/auth";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.is_admin ?? false);
  const isVerified = computed(() => !!user.value?.email_verified_at);

  async function fetchUser() {
    if (isLoading.value) return;

    try {
      isLoading.value = true;
      error.value = null;
      const response = await authService.getUser();
      user.value = response.data;
    } catch (e) {
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      isLoading.value = true;
      error.value = null;
      await authService.login(credentials);
      await fetchUser();

      const redirect = router.currentRoute.value.query.redirect as string;
      router.push(redirect || "/dashboard");
    } catch (e: any) {
      error.value = e.response?.data?.message || "Login failed";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(data: RegisterData) {
    try {
      isLoading.value = true;
      error.value = null;
      await authService.register(data);
      await fetchUser();
      router.push("/dashboard");
    } catch (e: any) {
      error.value = e.response?.data?.message || "Registration failed";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      user.value = null;
      router.push("/login");
    }
  }

  async function forgotPassword(email: string) {
    await authService.forgotPassword(email);
  }

  async function resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    await authService.resetPassword(data);
    router.push("/login");
  }

  function clearError() {
    error.value = null;
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
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  };
});
```

## Login Component

Create `src/views/LoginView.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const form = ref({
  email: "",
  password: "",
  remember: false,
});

const errors = ref<Record<string, string[]>>({});

async function handleSubmit() {
  errors.value = {};
  auth.clearError();

  try {
    await auth.login(form.value);
  } catch (e: any) {
    if (e.response?.data?.errors) {
      errors.value = e.response.data.errors;
    }
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-10">
    <h1 class="text-2xl font-bold mb-6">Login</h1>

    <div v-if="auth.error" class="bg-red-100 text-red-700 p-4 rounded mb-4">
      {{ auth.error }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
        <p v-if="errors.email" class="text-red-500 text-sm mt-1">
          {{ errors.email[0] }}
        </p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
        <p v-if="errors.password" class="text-red-500 text-sm mt-1">
          {{ errors.password[0] }}
        </p>
      </div>

      <div class="flex items-center">
        <input
          id="remember"
          v-model="form.remember"
          type="checkbox"
          class="rounded border-gray-300"
        />
        <label for="remember" class="ml-2 text-sm">Remember me</label>
      </div>

      <button
        type="submit"
        :disabled="auth.isLoading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ auth.isLoading ? "Logging in..." : "Login" }}
      </button>

      <div class="text-center text-sm">
        <RouterLink to="/forgot-password" class="text-blue-600 hover:underline">
          Forgot your password?
        </RouterLink>
      </div>

      <div class="text-center text-sm">
        Don't have an account?
        <RouterLink to="/register" class="text-blue-600 hover:underline">
          Register
        </RouterLink>
      </div>
    </form>
  </div>
</template>
```

## Register Component

Create `src/views/RegisterView.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const form = ref({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
});

const errors = ref<Record<string, string[]>>({});

async function handleSubmit() {
  errors.value = {};
  auth.clearError();

  try {
    await auth.register(form.value);
  } catch (e: any) {
    if (e.response?.data?.errors) {
      errors.value = e.response.data.errors;
    }
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-10">
    <h1 class="text-2xl font-bold mb-6">Register</h1>

    <div v-if="auth.error" class="bg-red-100 text-red-700 p-4 rounded mb-4">
      {{ auth.error }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
        <p v-if="errors.name" class="text-red-500 text-sm mt-1">
          {{ errors.name[0] }}
        </p>
      </div>

      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
        <p v-if="errors.email" class="text-red-500 text-sm mt-1">
          {{ errors.email[0] }}
        </p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
        <p v-if="errors.password" class="text-red-500 text-sm mt-1">
          {{ errors.password[0] }}
        </p>
      </div>

      <div>
        <label for="password_confirmation" class="block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          type="password"
          required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        :disabled="auth.isLoading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ auth.isLoading ? "Creating account..." : "Register" }}
      </button>

      <div class="text-center text-sm">
        Already have an account?
        <RouterLink to="/login" class="text-blue-600 hover:underline">
          Login
        </RouterLink>
      </div>
    </form>
  </div>
</template>
```

## Dashboard Component

Create `src/views/DashboardView.vue`:

```vue
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
</script>

<template>
  <div class="max-w-4xl mx-auto mt-10">
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <div
      v-if="!auth.isVerified"
      class="bg-yellow-100 text-yellow-800 p-4 rounded mb-6"
    >
      Please verify your email address.
      <button @click="auth.sendVerificationEmail" class="underline ml-2">
        Resend verification email
      </button>
    </div>

    <div class="bg-white shadow rounded p-6">
      <h2 class="text-lg font-semibold mb-4">
        Welcome, {{ auth.user?.name }}!
      </h2>
      <p class="text-gray-600">Email: {{ auth.user?.email }}</p>
      <p v-if="auth.isAdmin" class="text-green-600 mt-2">
        You have admin privileges.
      </p>
    </div>

    <button
      @click="auth.logout"
      class="mt-6 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
    >
      Logout
    </button>
  </div>
</template>
```

## Axios Interceptor for 401/419 Errors

Update `src/services/api.ts` to handle session expiration:

```typescript
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import router from "@/router";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session expired or unauthorized
    if (error.response?.status === 401 || error.response?.status === 419) {
      const auth = useAuthStore();
      auth.user = null;
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

_Next up: Updating the authenticated user's details._
