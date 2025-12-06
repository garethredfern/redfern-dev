---
title: "Building a Pagination Component with Vue 3 and Pinia"
description: "A complete guide to building a reusable Vue 3 pagination component with Pinia state management and TypeScript, consuming paginated data from a Laravel API."
tags: ["vue", "pinia", "pagination", "components", "typescript"]
pubDate: "2024-01-19T10:00:00Z"
series: "Laravel Vue SPA"
seriesOrder: 19
---

In the API Resources article we set up a `UserResource` using the paginate method. Laravel returns paginated data in this format:

```json
{
  "data": [
    { "id": 1, "name": "Luke Skywalker", "email": "luke@jedi.com" },
    { "id": 2, "name": "Ben Kenobi", "email": "ben@jedi.com" }
  ],
  "links": {
    "first": "http://example.com/users?page=1",
    "last": "http://example.com/users?page=5",
    "prev": null,
    "next": "http://example.com/users?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 75
  }
}
```

Let's build a reusable pagination system with Vue 3 and Pinia.

## Types

First, define the types for paginated responses. Create `src/types/pagination.ts`:

```typescript
export interface PaginationLinks {
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}
```

## User Service

Create `src/services/users.ts`:

```typescript
import api from './api'
import type { PaginatedResponse } from '@/types/pagination'

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  is_admin: boolean
  avatar: string | null
  created_at: string
}

export const userService = {
  async getUsers(page = 1): Promise<PaginatedResponse<User>> {
    const response = await api.get(`/api/users?page=${page}`)
    return response.data
  },

  async getUsersByUrl(url: string): Promise<PaginatedResponse<User>> {
    const response = await api.get(url)
    return response.data
  },
}
```

## Users Store with Pinia

Create `src/stores/users.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userService, type User } from '@/services/users'
import type { PaginationLinks, PaginationMeta } from '@/types/pagination'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const links = ref<PaginationLinks | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasUsers = computed(() => users.value.length > 0)
  const currentPage = computed(() => meta.value?.current_page ?? 1)
  const lastPage = computed(() => meta.value?.last_page ?? 1)
  const hasPrevPage = computed(() => links.value?.prev !== null)
  const hasNextPage = computed(() => links.value?.next !== null)

  async function fetchUsers(page = 1) {
    isLoading.value = true
    error.value = null

    try {
      const response = await userService.getUsers(page)
      users.value = response.data
      meta.value = response.meta
      links.value = response.links
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch users'
    } finally {
      isLoading.value = false
    }
  }

  async function goToPage(url: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await userService.getUsersByUrl(url)
      users.value = response.data
      meta.value = response.meta
      links.value = response.links
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch users'
    } finally {
      isLoading.value = false
    }
  }

  function goToFirst() {
    if (links.value?.first) {
      goToPage(links.value.first)
    }
  }

  function goToPrev() {
    if (links.value?.prev) {
      goToPage(links.value.prev)
    }
  }

  function goToNext() {
    if (links.value?.next) {
      goToPage(links.value.next)
    }
  }

  function goToLast() {
    if (links.value?.last) {
      goToPage(links.value.last)
    }
  }

  return {
    users,
    meta,
    links,
    isLoading,
    error,
    hasUsers,
    currentPage,
    lastPage,
    hasPrevPage,
    hasNextPage,
    fetchUsers,
    goToPage,
    goToFirst,
    goToPrev,
    goToNext,
    goToLast,
  }
})
```

## Pagination Component

Create a reusable `src/components/BasePagination.vue`:

```vue
<script setup lang="ts">
import type { PaginationLinks, PaginationMeta } from '@/types/pagination'

interface Props {
  meta: PaginationMeta
  links: PaginationLinks
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'first'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'last'): void
}>()
</script>

<template>
  <nav
    v-if="meta.last_page > 1"
    class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6"
    aria-label="Pagination"
  >
    <div class="hidden sm:block">
      <p class="text-sm text-gray-700">
        Showing
        <span class="font-medium">{{ meta.from }}</span>
        to
        <span class="font-medium">{{ meta.to }}</span>
        of
        <span class="font-medium">{{ meta.total }}</span>
        results
      </p>
    </div>

    <div class="flex flex-1 justify-between sm:justify-end gap-2">
      <button
        type="button"
        :disabled="!links.prev || isLoading"
        @click="emit('first')"
        class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        First
      </button>

      <button
        type="button"
        :disabled="!links.prev || isLoading"
        @click="emit('prev')"
        class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
        {{ meta.current_page }} / {{ meta.last_page }}
      </span>

      <button
        type="button"
        :disabled="!links.next || isLoading"
        @click="emit('next')"
        class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>

      <button
        type="button"
        :disabled="!links.next || isLoading"
        @click="emit('last')"
        class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Last
      </button>
    </div>
  </nav>
</template>
```

## Users View

Create `src/views/UsersView.vue`:

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import BasePagination from '@/components/BasePagination.vue'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()

// Fetch users on mount
onMounted(() => {
  const page = parseInt(route.query.page as string) || 1
  usersStore.fetchUsers(page)
})

// Update URL when page changes
watch(
  () => usersStore.currentPage,
  (page) => {
    router.replace({ query: { page: page.toString() } })
  }
)

function handleFirst() {
  usersStore.goToFirst()
}

function handlePrev() {
  usersStore.goToPrev()
}

function handleNext() {
  usersStore.goToNext()
}

function handleLast() {
  usersStore.goToLast()
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10">
    <h1 class="text-2xl font-bold mb-6">Users</h1>

    <!-- Loading State -->
    <div v-if="usersStore.isLoading" class="text-center py-10">
      <p class="text-gray-500">Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="usersStore.error" class="bg-red-50 text-red-600 p-4 rounded">
      {{ usersStore.error }}
    </div>

    <!-- Users List -->
    <div v-else>
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in usersStore.users" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img
                    v-if="user.avatar"
                    :src="user.avatar"
                    :alt="user.name"
                    class="h-10 w-10 rounded-full"
                  />
                  <div
                    v-else
                    class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    <span class="text-gray-500 text-sm">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ user.name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="user.email_verified_at"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                >
                  Verified
                </span>
                <span
                  v-else
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"
                >
                  Pending
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <BasePagination
          v-if="usersStore.meta && usersStore.links"
          :meta="usersStore.meta"
          :links="usersStore.links"
          :is-loading="usersStore.isLoading"
          @first="handleFirst"
          @prev="handlePrev"
          @next="handleNext"
          @last="handleLast"
        />
      </div>
    </div>
  </div>
</template>
```

## Generic Pagination Composable

For more flexibility, create a composable that works with any paginated data. Create `src/composables/usePagination.ts`:

```typescript
import { ref, computed } from 'vue'
import type { PaginationLinks, PaginationMeta, PaginatedResponse } from '@/types/pagination'

export function usePagination<T>(
  fetchFunction: (page: number) => Promise<PaginatedResponse<T>>
) {
  const items = ref<T[]>([]) as { value: T[] }
  const meta = ref<PaginationMeta | null>(null)
  const links = ref<PaginationLinks | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const currentPage = computed(() => meta.value?.current_page ?? 1)
  const lastPage = computed(() => meta.value?.last_page ?? 1)
  const hasPrev = computed(() => links.value?.prev !== null)
  const hasNext = computed(() => links.value?.next !== null)

  async function fetchPage(page = 1) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetchFunction(page)
      items.value = response.data
      meta.value = response.meta
      links.value = response.links
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch data'
    } finally {
      isLoading.value = false
    }
  }

  function goToFirst() {
    fetchPage(1)
  }

  function goToPrev() {
    if (meta.value && meta.value.current_page > 1) {
      fetchPage(meta.value.current_page - 1)
    }
  }

  function goToNext() {
    if (meta.value && meta.value.current_page < meta.value.last_page) {
      fetchPage(meta.value.current_page + 1)
    }
  }

  function goToLast() {
    if (meta.value) {
      fetchPage(meta.value.last_page)
    }
  }

  return {
    items,
    meta,
    links,
    isLoading,
    error,
    currentPage,
    lastPage,
    hasPrev,
    hasNext,
    fetchPage,
    goToFirst,
    goToPrev,
    goToNext,
    goToLast,
  }
}
```

Usage example:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePagination } from '@/composables/usePagination'
import { userService, type User } from '@/services/users'

const {
  items: users,
  meta,
  links,
  isLoading,
  fetchPage,
  goToNext,
  goToPrev,
} = usePagination<User>(userService.getUsers)

onMounted(() => fetchPage(1))
</script>
```

---

*Next up: Hosting and deploying your application.*
