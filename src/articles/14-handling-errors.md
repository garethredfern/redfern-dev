---
title: "Handling API Errors in Your Vue 3 SPA"
description: "How to handle validation errors, server errors, and network failures gracefully in a Vue 3 SPA consuming a Laravel API."
tags: ["vue", "laravel", "error-handling", "api", "typescript"]
pubDate: "2024-01-14T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 14
---

A good user experience requires graceful error handling. Let's build a robust error handling system for our Vue 3 SPA.

## Types of Errors

Your SPA will encounter several types of errors:

1. **Validation errors** (422) - User input doesn't meet requirements
2. **Authentication errors** (401) - User isn't logged in
3. **Session errors** (419) - CSRF token mismatch or session expired
4. **Authorization errors** (403) - User lacks permission
5. **Not found errors** (404) - Resource doesn't exist
6. **Server errors** (500) - Something went wrong on the server
7. **Network errors** - No response (server down, no internet)

## Error Response Format

Laravel returns validation errors in this format:

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."],
    "password": [
      "The password field is required.",
      "The password must be at least 8 characters."
    ]
  }
}
```

## Error Utility

Create `src/utils/errors.ts`:

```typescript
import type { AxiosError } from "axios";

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ApiError {
  message: string;
  errors?: ValidationErrors;
  status?: number;
}

export function parseError(error: unknown): ApiError {
  // Network error - no response received
  if (error instanceof Error && !("response" in error)) {
    return {
      message: "Network error. Please check your connection.",
      status: 0,
    };
  }

  const axiosError = error as AxiosError<{
    message?: string;
    errors?: ValidationErrors;
  }>;

  // No response object (shouldn't happen with Axios, but just in case)
  if (!axiosError.response) {
    return {
      message: "An unexpected error occurred.",
      status: 0,
    };
  }

  const { status, data } = axiosError.response;

  // Validation errors
  if (status === 422 && data.errors) {
    return {
      message: data.message || "Validation failed.",
      errors: data.errors,
      status,
    };
  }

  // Standard error messages by status
  const statusMessages: Record<number, string> = {
    401: "Please log in to continue.",
    403: "You don't have permission to do that.",
    404: "The requested resource was not found.",
    419: "Your session has expired. Please refresh and try again.",
    429: "Too many requests. Please slow down.",
    500: "Server error. Please try again later.",
    503: "Service temporarily unavailable.",
  };

  return {
    message: data.message || statusMessages[status] || "An error occurred.",
    status,
  };
}

export function getFirstError(errors: ValidationErrors): string | null {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey][0] : null;
}
```

## Axios Interceptor

Update `src/services/api.ts` to handle errors globally:

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
  async (error) => {
    const status = error.response?.status;

    // Handle authentication errors
    if (status === 401 || status === 419) {
      const auth = useAuthStore();
      auth.user = null;

      // Only redirect if not already on a guest page
      const currentRoute = router.currentRoute.value;
      if (currentRoute.meta.requiresAuth) {
        router.push({
          name: "login",
          query: { redirect: currentRoute.fullPath },
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Form Error Display Component

Create `src/components/FormErrors.vue`:

```vue
<script setup lang="ts">
import type { ValidationErrors } from "@/utils/errors";

defineProps<{
  errors: ValidationErrors;
}>();
</script>

<template>
  <div
    v-if="Object.keys(errors).length"
    class="bg-red-50 border border-red-200 rounded-lg p-4"
  >
    <h3 class="text-red-800 font-medium mb-2">
      Please fix the following errors:
    </h3>
    <ul class="list-disc list-inside space-y-1">
      <template v-for="(fieldErrors, field) in errors" :key="field">
        <li
          v-for="(message, index) in fieldErrors"
          :key="`${field}-${index}`"
          class="text-red-600 text-sm"
        >
          {{ message }}
        </li>
      </template>
    </ul>
  </div>
</template>
```

## Toast Notifications

Create a toast notification system. First, the store `src/stores/toast.ts`:

```typescript
import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 0;

  function show(message: string, type: ToastType = "info", duration = 5000) {
    const id = nextId++;
    toasts.value.push({ id, message, type });

    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }

  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(message: string) {
    show(message, "success");
  }

  function error(message: string) {
    show(message, "error");
  }

  function warning(message: string) {
    show(message, "warning");
  }

  function info(message: string) {
    show(message, "info");
  }

  return { toasts, show, remove, success, error, warning, info };
});
```

Create `src/components/ToastContainer.vue`:

```vue
<script setup lang="ts">
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const typeClasses = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="[
          'px-4 py-3 rounded-lg text-white shadow-lg max-w-sm',
          typeClasses[t.type],
        ]"
      >
        <div class="flex items-center justify-between gap-4">
          <p>{{ t.message }}</p>
          <button
            @click="toast.remove(t.id)"
            class="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
```

Add it to your `App.vue`:

```vue
<script setup lang="ts">
import ToastContainer from "@/components/ToastContainer.vue";
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
```

## Using Error Handling in Components

```vue
<script setup lang="ts">
import { ref } from "vue";
import { parseError, type ValidationErrors } from "@/utils/errors";
import { useToastStore } from "@/stores/toast";
import FormErrors from "@/components/FormErrors.vue";

const toast = useToastStore();
const errors = ref<ValidationErrors>({});
const isLoading = ref(false);

async function handleSubmit() {
  errors.value = {};
  isLoading.value = true;

  try {
    await someApiCall();
    toast.success("Operation completed successfully!");
  } catch (e) {
    const apiError = parseError(e);

    if (apiError.errors) {
      errors.value = apiError.errors;
    } else {
      toast.error(apiError.message);
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <FormErrors :errors="errors" />

    <!-- Form fields -->

    <button type="submit" :disabled="isLoading">Submit</button>
  </form>
</template>
```

---

_Next up: Vue middleware patterns for route protection._
