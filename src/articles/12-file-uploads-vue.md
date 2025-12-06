---
title: "Building a File Upload Component in Vue 3"
description: "Create a reusable file upload component in Vue 3 with TypeScript, progress tracking, and drag-and-drop support."
tags: ["vue", "file-uploads", "components", "typescript", "forms"]
pubDate: "2024-01-12T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 12
---

Let's build a reusable file upload component for Vue 3 with TypeScript support.

## File Upload Service

Create `src/services/files.ts`:

```typescript
import api from "./api";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const fileService = {
  async uploadAvatar(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ) {
    const formData = new FormData();
    formData.append("avatar", file);

    return api.post("/api/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            ),
          });
        }
      },
    });
  },

  async deleteAvatar() {
    return api.delete("/api/user/avatar");
  },
};
```

## Avatar Upload Component

Create `src/components/AvatarUpload.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { fileService, type UploadProgress } from "@/services/files";

const auth = useAuthStore();

const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const error = ref<string | null>(null);

const avatarUrl = computed(() => auth.user?.avatar);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (files?.length) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files?.length) {
    handleFile(files[0]);
  }
}

async function handleFile(file: File) {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    error.value = "Please select an image file";
    return;
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    error.value = "File size must be less than 2MB";
    return;
  }

  error.value = null;
  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    await fileService.uploadAvatar(file, (progress: UploadProgress) => {
      uploadProgress.value = progress.percentage;
    });

    await auth.fetchUser();
  } catch (e: any) {
    error.value = e.response?.data?.message || "Upload failed";
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;

    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
}

async function removeAvatar() {
  if (!confirm("Are you sure you want to remove your avatar?")) {
    return;
  }

  try {
    await fileService.deleteAvatar();
    await auth.fetchUser();
  } catch (e: any) {
    error.value = e.response?.data?.message || "Failed to remove avatar";
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Current Avatar -->
    <div class="flex items-center gap-4">
      <div class="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="Avatar"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-gray-400"
        >
          <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </div>
      </div>

      <div>
        <button
          @click="triggerFileInput"
          :disabled="isUploading"
          class="text-blue-600 hover:underline disabled:opacity-50"
        >
          Change avatar
        </button>
        <button
          v-if="avatarUrl"
          @click="removeAvatar"
          :disabled="isUploading"
          class="ml-4 text-red-600 hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- Drop Zone -->
    <div
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="isUploading" class="space-y-2">
        <p>Uploading... {{ uploadProgress }}%</p>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>

      <div v-else>
        <p class="text-gray-600">Drag and drop an image, or click to select</p>
        <p class="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 2MB</p>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="text-red-500 text-sm">
      {{ error }}
    </p>
  </div>
</template>
```

## Update User Type

Update `src/services/auth.ts` to include avatar:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_admin?: boolean;
  avatar?: string | null;
}
```

## Add to Settings Page

Update `src/views/SettingsView.vue`:

```vue
<script setup lang="ts">
import ProfileForm from "@/components/ProfileForm.vue";
import PasswordForm from "@/components/PasswordForm.vue";
import AvatarUpload from "@/components/AvatarUpload.vue";
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10 space-y-8">
    <div class="bg-white shadow rounded p-6">
      <h2 class="text-xl font-semibold mb-4">Avatar</h2>
      <AvatarUpload />
    </div>

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

## Generic File Upload Component

For more flexibility, here's a generic file upload component. Create `src/components/FileUpload.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";

interface Props {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accept: "*",
  maxSize: 5,
  multiple: false,
});

const emit = defineEmits<{
  (e: "files", files: File[]): void;
  (e: "error", message: string): void;
}>();

const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (files) {
    handleFiles(Array.from(files));
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    handleFiles(Array.from(files));
  }
}

function handleFiles(files: File[]) {
  const maxBytes = props.maxSize * 1024 * 1024;

  for (const file of files) {
    if (file.size > maxBytes) {
      emit("error", `File "${file.name}" exceeds ${props.maxSize}MB limit`);
      return;
    }
  }

  emit("files", files);

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}
</script>

<template>
  <div
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="triggerFileInput"
    :class="[
      'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
      isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400',
    ]"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleFileSelect"
    />

    <slot>
      <p class="text-gray-600">Drag and drop files, or click to select</p>
      <p class="text-sm text-gray-400 mt-1">Max file size: {{ maxSize }}MB</p>
    </slot>
  </div>
</template>
```

---

_Next up: Shaping API responses with Laravel Resources._
