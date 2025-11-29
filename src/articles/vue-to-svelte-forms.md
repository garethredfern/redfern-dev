---
title: "Form Handling: Moving from Vue to Svelte"
description: "A practical guide to translating Vue form patterns to Svelte, covering two-way binding, validation, async submission, and what actually works better in each framework."
tags: ["vue", "svelte"]
pubDate: "2025-11-28T09:00:00Z"
link: "vue-to-svelte-forms"
---

## Form Handling: Moving from Vue to Svelte

One of the first real-world challenges you'll face when learning Svelte is form handling. Coming from Vue, you're used to `v-model` making two-way binding feel like magic. Svelte takes a different approach that feels more explicit at first, but once you understand the pattern, it's equally elegant.

Let me show you the key differences and how to translate your Vue knowledge to Svelte.

## Two-Way Binding: The Foundation

**Vue's Approach:**

```vue
<script setup>
import { ref } from "vue";

const email = ref("");
const message = ref("");
</script>

<template>
  <div>
    <input v-model="email" type="email" />
    <textarea v-model="message"></textarea>
    <p>Email: {{ email }}</p>
    <p>Message length: {{ message.length }}</p>
  </div>
</template>
```

Vue's `v-model` is syntactic sugar that handles both the value binding and the input event for you. It's clean and you don't think about it.

**Svelte's Approach:**

```svelte
<script>
  let email = $state('')
  let message = $state('')
</script>

<div>
  <input bind:value={email} type="email" />
  <textarea bind:value={message}></textarea>
  <p>Email: {email}</p>
  <p>Message length: {message.length}</p>
</div>
```

Svelte uses `bind:value` which is more explicit about what's happening - you're binding the value property. The reactivity comes from Svelte 5's `$state` rune, which makes any assignment to these variables automatically trigger updates.

🟢 **Vue:** `v-model` - implicit, convenient, hides the mechanics
🟠 **Svelte:** `bind:value` - explicit, clear about what's being bound

## Form Validation: Real-World Patterns

Let's build a contact form with validation - something you'd actually ship to production.

**Vue Implementation:**

```vue
<script setup>
import { ref, computed } from "vue";

const formData = ref({
  name: "",
  email: "",
  message: "",
});

const errors = ref({});
const touched = ref({});

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateField = (field) => {
  touched.value[field] = true;

  switch (field) {
    case "name":
      errors.value.name =
        formData.value.name.length < 2
          ? "Name must be at least 2 characters"
          : "";
      break;
    case "email":
      errors.value.email = !isValidEmail(formData.value.email)
        ? "Please enter a valid email"
        : "";
      break;
    case "message":
      errors.value.message =
        formData.value.message.length < 10
          ? "Message must be at least 10 characters"
          : "";
      break;
  }
};

const isValid = computed(() => {
  return (
    Object.values(errors.value).every((error) => !error) &&
    formData.value.name &&
    formData.value.email &&
    formData.value.message
  );
});

const handleSubmit = async () => {
  // Validate all fields
  Object.keys(formData.value).forEach(validateField);

  if (!isValid.value) return;

  console.log("Submitting:", formData.value);
  // API call here
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="name">Name</label>
      <input
        id="name"
        v-model="formData.name"
        @blur="validateField('name')"
        :class="{ error: touched.name && errors.name }"
      />
      <span v-if="touched.name && errors.name" class="error-message">
        {{ errors.name }}
      </span>
    </div>

    <div>
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        v-model="formData.email"
        @blur="validateField('email')"
        :class="{ error: touched.email && errors.email }"
      />
      <span v-if="touched.email && errors.email" class="error-message">
        {{ errors.email }}
      </span>
    </div>

    <div>
      <label for="message">Message</label>
      <textarea
        id="message"
        v-model="formData.message"
        @blur="validateField('message')"
        :class="{ error: touched.message && errors.message }"
      ></textarea>
      <span v-if="touched.message && errors.message" class="error-message">
        {{ errors.message }}
      </span>
    </div>

    <button type="submit" :disabled="!isValid">Submit</button>
  </form>
</template>

<style scoped>
.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
}
</style>
```

**Svelte Implementation:**

```svelte
<script>
  let formData = $state({
    name: '',
    email: '',
    message: ''
  })

  let errors = $state({})
  let touched = $state({})

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validateField(field) {
    touched[field] = true

    switch(field) {
      case 'name':
        errors.name = formData.name.length < 2
          ? 'Name must be at least 2 characters'
          : ''
        break
      case 'email':
        errors.email = !isValidEmail(formData.email)
          ? 'Please enter a valid email'
          : ''
        break
      case 'message':
        errors.message = formData.message.length < 10
          ? 'Message must be at least 10 characters'
          : ''
        break
    }
  }

  const isValid = $derived(
    Object.values(errors).every(error => !error) &&
    formData.name &&
    formData.email &&
    formData.message
  )

  async function handleSubmit(e) {
    e.preventDefault()

    // Validate all fields
    Object.keys(formData).forEach(validateField)

    if (!isValid) return

    console.log('Submitting:', formData)
    // API call here
  }
</script>

<form onsubmit={handleSubmit}>
  <div>
    <label for="name">Name</label>
    <input
      id="name"
      bind:value={formData.name}
      onblur={() => validateField('name')}
      class:error={touched.name && errors.name}
    />
    {#if touched.name && errors.name}
      <span class="error-message">{errors.name}</span>
    {/if}
  </div>

  <div>
    <label for="email">Email</label>
    <input
      id="email"
      type="email"
      bind:value={formData.email}
      onblur={() => validateField('email')}
      class:error={touched.email && errors.email}
    />
    {#if touched.email && errors.email}
      <span class="error-message">{errors.email}</span>
    {/if}
  </div>

  <div>
    <label for="message">Message</label>
    <textarea
      id="message"
      bind:value={formData.message}
      onblur={() => validateField('message')}
      class:error={touched.message && errors.message}
    ></textarea>
    {#if touched.message && errors.message}
      <span class="error-message">{errors.message}</span>
    {/if}
  </div>

  <button type="submit" disabled={!isValid}>
    Submit
  </button>
</form>

<style>
  .error {
    border-color: #ef4444;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
  }
</style>
```

## Key Differences Breakdown

### 1. Event Handlers

🟢 **Vue:** `@blur`, `@submit.prevent`
🟠 **Svelte:** `onblur`, `onsubmit` (you call preventDefault yourself)

Vue's event modifiers (`.prevent`, `.stop`) are convenient shortcuts. Svelte doesn't have these - you handle preventDefault explicitly in your handler. More verbose, but nothing magical happening.

### 2. Computed Values

🟢 **Vue:** `computed()` for derived state
🟠 **Svelte:** `$derived()` rune

Both create values that automatically update when dependencies change. Vue's `computed` is a function that returns a ref. Svelte's `$derived` is more like a reactive constant - it feels lighter.

### 3. Class Binding

🟢 **Vue:** `:class="{ error: condition }"`
🟠 **Svelte:** `class:error={condition}`

Svelte's `class:` directive is more explicit about what you're doing - adding/removing a specific class based on a condition.

### 4. Conditional Rendering

🟢 **Vue:** `v-if`
🟠 **Svelte:** `{#if}`

Svelte uses template logic blocks with `{#if}...{/if}`. Coming from Vue, this feels more like traditional templating languages. It's just a different syntax for the same concept.

## Form Submission with Loading States

Real forms need loading states and error handling. Here's how both frameworks handle async operations:

**Vue:**

```vue
<script setup>
import { ref } from "vue";

const isSubmitting = ref(false);
const submitError = ref("");
const submitSuccess = ref(false);

const handleSubmit = async () => {
  isSubmitting.value = true;
  submitError.value = "";
  submitSuccess.value = false;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData.value),
    });

    if (!response.ok) throw new Error("Submission failed");

    submitSuccess.value = true;
    formData.value = { name: "", email: "", message: "" };
  } catch (error) {
    submitError.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- form fields... -->

    <button type="submit" :disabled="!isValid || isSubmitting">
      {{ isSubmitting ? "Sending..." : "Submit" }}
    </button>

    <div v-if="submitError" class="error-message">
      {{ submitError }}
    </div>

    <div v-if="submitSuccess" class="success-message">
      Message sent successfully!
    </div>
  </form>
</template>
```

**Svelte:**

```svelte
<script>
  let isSubmitting = $state(false)
  let submitError = $state('')
  let submitSuccess = $state(false)

  async function handleSubmit(e) {
    e.preventDefault()

    isSubmitting = true
    submitError = ''
    submitSuccess = false

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Submission failed')

      submitSuccess = true
      formData = { name: '', email: '', message: '' }
    } catch (error) {
      submitError = error.message
    } finally {
      isSubmitting = false
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <!-- form fields... -->

  <button type="submit" disabled={!isValid || isSubmitting}>
    {isSubmitting ? 'Sending...' : 'Submit'}
  </button>

  {#if submitError}
    <div class="error-message">{submitError}</div>
  {/if}

  {#if submitSuccess}
    <div class="success-message">Message sent successfully!</div>
  {/if}
</form>
```

The patterns are nearly identical. The biggest difference? You're not wrapping everything in `.value` with Svelte. You just assign directly: `isSubmitting = true` instead of `isSubmitting.value = true`.

## Checkbox and Radio Inputs

These always feel a bit special in forms. Here's how both frameworks handle them:

**Vue - Checkboxes:**

```vue
<script setup>
import { ref } from "vue";

const interests = ref([]);
</script>

<template>
  <div>
    <label>
      <input type="checkbox" v-model="interests" value="vue" />
      Vue.js
    </label>
    <label>
      <input type="checkbox" v-model="interests" value="svelte" />
      Svelte
    </label>
    <label>
      <input type="checkbox" v-model="interests" value="react" />
      React
    </label>

    <p>Selected: {{ interests.join(", ") }}</p>
  </div>
</template>
```

**Svelte - Checkboxes:**

```svelte
<script>
  let interests = $state([])
</script>

<div>
  <label>
    <input type="checkbox" bind:group={interests} value="vue" />
    Vue.js
  </label>
  <label>
    <input type="checkbox" bind:group={interests} value="svelte" />
    Svelte
  </label>
  <label>
    <input type="checkbox" bind:group={interests} value="react" />
    React
  </label>

  <p>Selected: {interests.join(', ')}</p>
</div>
```

🟢 **Vue:** Uses `v-model` on multiple checkboxes with same array
🟠 **Svelte:** Uses `bind:group` to bind multiple inputs to same array

Both automatically handle adding/removing values from the array. Svelte's `bind:group` is more explicit about what's happening - you're grouping these inputs together.

**Radio buttons** work the same way, just with a single value instead of an array.

## What I Actually Prefer

Coming from Vue, here's what surprised me:

**Svelte wins:**

- Direct assignment (`isSubmitting = true`) feels cleaner than `.value` everywhere
- `$derived` for computed values feels lighter than `computed()`
- Less magic overall - when something breaks, it's easier to understand why

**Vue wins:**

- Event modifiers (`.prevent`, `.stop`, `.once`) are genuinely convenient
- `v-model` feels more intuitive than `bind:value` for beginners
- The ref/reactive mental model is well-documented and understood

**Dead heat:**

- Both handle async form submission elegantly
- Validation patterns are nearly identical
- Performance differences are negligible for forms

## The Bottom Line

If you're coming from Vue, Svelte form handling will feel familiar but more explicit. There's less "magic" - you write slightly more code, but it's clearer what's happening.

The patterns translate almost 1:1. You're not learning new concepts, just new syntax. Once you internalize `bind:value`, `$state`, and `$derived`, you'll be writing Svelte forms as fast as Vue forms.

And honestly? Both frameworks handle forms well. Pick whichever syntax makes you happier.

---

**Next in this series:** I'm planning to cover component composition - how slots and props compare between Vue and Svelte. If there's something specific about forms you want me to dig into, let me know.

**Code examples:** All the code in this post is copy-paste ready. If something doesn't work for you, I probably made a typo - let me know and I'll fix it.
