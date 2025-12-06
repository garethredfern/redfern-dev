---
title: "Updating User Profile Information"
description: "How to update a user's profile details in a Vue 3 SPA using Laravel Fortify's profile update functionality."
tags: ["vue", "laravel", "fortify", "user-profile", "forms"]
pubDate: "2024-01-09T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 9
---

Laravel Fortify provides a `/user/profile-information` endpoint for updating user details. Let's build the frontend for this.

## Laravel Configuration

Ensure the profile information endpoint is in your CORS paths in `config/cors.php`:

```php
'paths' => [
    // ...
    'user/profile-information',
],
```

Fortify's `UpdateUserProfileInformation` action handles the validation and update logic. The default implementation is in `app/Actions/Fortify/UpdateUserProfileInformation.php`.

## Profile Form Component

Create `src/components/ProfileForm.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth";

const auth = useAuthStore();

const form = ref({
  name: "",
  email: "",
});

const errors = ref<Record<string, string[]>>({});
const message = ref<string | null>(null);
const isLoading = ref(false);

onMounted(() => {
  if (auth.user) {
    form.value.name = auth.user.name;
    form.value.email = auth.user.email;
  }
});

async function handleSubmit() {
  errors.value = {};
  message.value = null;
  isLoading.value = true;

  try {
    await authService.updateProfile(form.value);
    await auth.fetchUser();
    message.value = "Profile updated successfully.";
  } catch (e: any) {
    if (e.response?.data?.errors) {
      errors.value = e.response.data.errors;
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="message" class="bg-green-100 text-green-700 p-4 rounded">
      {{ message }}
    </div>

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

    <button
      type="submit"
      :disabled="isLoading"
      class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {{ isLoading ? "Saving..." : "Update Profile" }}
    </button>
  </form>
</template>
```

## Password Update Component

Create `src/components/PasswordForm.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { authService } from "@/services/auth";

const form = ref({
  current_password: "",
  password: "",
  password_confirmation: "",
});

const errors = ref<Record<string, string[]>>({});
const message = ref<string | null>(null);
const isLoading = ref(false);

async function handleSubmit() {
  errors.value = {};
  message.value = null;
  isLoading.value = true;

  try {
    await authService.updatePassword(form.value);
    message.value = "Password updated successfully.";

    // Clear form
    form.value = {
      current_password: "",
      password: "",
      password_confirmation: "",
    };
  } catch (e: any) {
    if (e.response?.data?.errors) {
      errors.value = e.response.data.errors;
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="message" class="bg-green-100 text-green-700 p-4 rounded">
      {{ message }}
    </div>

    <div>
      <label for="current_password" class="block text-sm font-medium">
        Current Password
      </label>
      <input
        id="current_password"
        v-model="form.current_password"
        type="password"
        required
        class="mt-1 block w-full rounded border-gray-300 shadow-sm"
      />
      <p v-if="errors.current_password" class="text-red-500 text-sm mt-1">
        {{ errors.current_password[0] }}
      </p>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium">
        New Password
      </label>
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
        Confirm New Password
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
      :disabled="isLoading"
      class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {{ isLoading ? "Updating..." : "Update Password" }}
    </button>
  </form>
</template>
```

## Settings Page

Create `src/views/SettingsView.vue` to combine both forms:

```vue
<script setup lang="ts">
import ProfileForm from "@/components/ProfileForm.vue";
import PasswordForm from "@/components/PasswordForm.vue";
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10 space-y-8">
    <div class="bg-white shadow rounded p-6">
      <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
      <ProfileForm />
    </div>

    <div class="bg-white shadow rounded p-6">
      <h2 class="text-xl font-semibold mb-4">Update Password</h2>
      <PasswordForm />
    </div>
  </div>
</template>
```

## Add Route

Update `src/router/index.ts`:

```typescript
{
  path: '/settings',
  name: 'settings',
  component: () => import('@/views/SettingsView.vue'),
  meta: { requiresAuth: true },
},
```

---

_Next up: Setting up basic authorization with admin roles._
