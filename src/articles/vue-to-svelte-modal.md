---
title: "Building a Modal: Vue vs Svelte"
description: "A side-by-side comparison of building a modal component in Vue 3 and Svelte 5, exploring the differences in reactivity, props, and component patterns."
tags: ["vue", "svelte"]
published: "2025-11-27"
permalink: "vue-to-svelte-modal"
---

I've been a Vue developer for years. Recently, I decided to rebuild some of my go-to components in Svelte to see how it compares. Starting with something I've built dozens of times: a modal.

What surprised me wasn't just the syntax differences—it was how each framework's philosophy shapes the way you think about the same problem.

## The Basic Structure

Let's start with just opening and closing a modal. No fancy features yet.

### Vue 3

```vue
<script setup>
import { ref } from "vue";

const isOpen = ref(false);
</script>

<template>
  <button @click="isOpen = true">Open Modal</button>

  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-panel">
      <h2>Hello from Vue</h2>
      <button @click="isOpen = false">Close</button>
    </div>
  </div>
</template>
```

### Svelte 5

```svelte
<script>
  let isOpen = $state(false)
</script>

<button onclick={() => isOpen = true}>Open Modal</button>

{#if isOpen}
  <div class="modal-backdrop">
    <div class="modal-panel">
      <h2>Hello from Svelte</h2>
      <button onclick={() => isOpen = false}>Close</button>
    </div>
  </div>
{/if}
```

The first thing that struck me: Svelte's `$state()` rune feels closer to how I'd write vanilla JavaScript. No `.value` to remember. Vue's `ref()` is explicit about what's reactive, which has its benefits for larger codebases, but Svelte's approach just _clicks_ when you're used to thinking in plain JS.

## Making It Reusable: Props and Two-Way Binding

A modal needs to be controlled by its parent. In Vue, we use `v-model` for two-way binding. Svelte has its own approach.

### Vue 3

```vue
<!-- BaseModal.vue -->
<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
});

const emit = defineEmits(["update:modelValue"]);

const close = () => emit("update:modelValue", false);
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal-panel">
      <h2>{{ title }}</h2>
      <slot />
      <button @click="close">Close</button>
    </div>
  </div>
</template>
```

```vue
<!-- Usage -->
<BaseModal v-model="showModal" title="Confirm">
  <p>Are you sure?</p>
</BaseModal>
```

### Svelte 5

```svelte
<!-- Modal.svelte -->
<script>
  let { open = $bindable(false), title, children } = $props()

  function close() {
    open = false
  }
</script>

{#if open}
  <div class="modal-backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="modal-panel">
      <h2>{title}</h2>
      {@render children()}
      <button onclick={close}>Close</button>
    </div>
  </div>
{/if}
```

```svelte
<!-- Usage -->
<Modal bind:open={showModal} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

Svelte's `$bindable()` rune is the equivalent of Vue's `v-model` pattern. The `@render children()` replaces the old slot syntax from Svelte 4—took me a minute to adjust to that one.

What I appreciate about Vue's approach: the `modelValue` / `update:modelValue` convention is explicit. You always know what's happening. Svelte's `$bindable` is more magical but results in less boilerplate.

## Click Outside to Close

Both frameworks need a way to detect clicks outside the modal panel.

### Vue 3

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const modalRef = ref(null);

const handleClickOutside = (e) => {
  if (modalRef.value && !modalRef.value.contains(e.target)) {
    emit("update:modelValue", false);
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop">
    <div ref="modalRef" class="modal-panel">
      <!-- content -->
    </div>
  </div>
</template>
```

### Svelte 5

```svelte
<script>
  let modalRef = $state(null)

  function handleClickOutside(e) {
    if (modalRef && !modalRef.contains(e.target)) {
      open = false
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

{#if open}
  <div class="modal-backdrop">
    <div bind:this={modalRef} class="modal-panel">
      <!-- content -->
    </div>
  </div>
{/if}
```

The `$effect()` rune is Svelte's answer to Vue's lifecycle hooks combined with watchers. Returning a cleanup function from the effect handles the unmount case automatically—this pattern felt natural coming from React's `useEffect`, but Vue devs might need a moment to adjust.

## Escape Key to Close

Keyboard accessibility matters. Here's how each framework handles the escape key.

### Vue 3

```vue
<script setup>
const handleEscape = (e) => {
  if (e.key === "Escape") emit("update:modelValue", false);
};

onMounted(() => document.addEventListener("keydown", handleEscape));
onUnmounted(() => document.removeEventListener("keydown", handleEscape));
</script>
```

### Svelte 5

```svelte
<script>
  $effect(() => {
    if (open) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') open = false
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  })
</script>
```

Same pattern as click-outside. In Svelte, I like that the `$effect()` naturally groups the setup and cleanup together. In Vue, you split it across `onMounted` and `onUnmounted`, which can make it harder to see the full picture at a glance.

## Transitions

Modals need smooth enter/exit animations. This is where the frameworks diverge more significantly.

### Vue 3

```vue
<template>
  <Transition
    enter-active-class="duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="modelValue" class="modal-backdrop">
      <!-- content -->
    </div>
  </Transition>
</template>
```

### Svelte 5

```svelte
<script>
  import { fade, scale } from 'svelte/transition'
</script>

{#if open}
  <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
    <div class="modal-panel" transition:scale={{ start: 0.95, duration: 200 }}>
      <!-- content -->
    </div>
  </div>
{/if}
```

Svelte's transition directive is genuinely delightful. `transition:fade` just works. Vue's `<Transition>` component is more verbose but gives you fine-grained control with CSS classes, which can be more flexible for complex animations.

## The Verdict

After rebuilding this modal, here's my honest take:

**Svelte wins on:** Developer experience, less boilerplate, transitions, and that "just JavaScript" feeling.

**Vue wins on:** Explicitness, TypeScript integration, and ecosystem maturity.

Neither is objectively better. Svelte made me smile more while building this component. Vue made me feel more confident about maintaining it in a team setting.

If you're a Vue dev curious about Svelte, I'd encourage you to try this exercise yourself. Pick a component you know well and rebuild it. The comparison teaches you more about _both_ frameworks than any tutorial.

---

_Follow along as I rebuild more Vue components in Svelte. Next up: a dropdown menu with keyboard navigation._
