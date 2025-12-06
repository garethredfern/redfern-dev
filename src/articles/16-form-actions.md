---
title: "Form Actions"
description: "Handle form submissions with SvelteKit's actions. Learn progressive enhancement, validation, and how to build forms that work without JavaScript."
tags: ["svelte", "sveltekit", "forms"]
pubDate: "2025-12-05T09:00:00Z"
series: "svelte-basics"
seriesOrder: 17
---

## Lesson 16: Form Actions

Forms are fundamental to web apps. SvelteKit handles them beautifully with progressive enhancement — forms work without JavaScript, and get enhanced when it's available.

## Basic Form Action

Define actions in `+page.server.js`:

```javascript
// src/routes/contact/+page.server.js
export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    // Do something with the data
    await sendEmail({ name, email, message });

    return { success: true };
  },
};
```

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  export let form
</script>

{#if form?.success}
  <p class="success">Message sent!</p>
{/if}

<form method="POST">
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>
```

Key points:

- `method="POST"` — Form posts to the same page
- `export let form` — Receives the action's return value
- No JavaScript needed — this works with JS disabled

## Named Actions

Multiple actions on one page:

```javascript
// src/routes/todos/+page.server.js
export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const text = data.get("text");

    await db.createTodo(text);
    return { created: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get("id");

    await db.deleteTodo(id);
    return { deleted: true };
  },

  toggle: async ({ request }) => {
    const data = await request.formData();
    const id = data.get("id");

    await db.toggleTodo(id);
  },
};
```

```svelte
<!-- src/routes/todos/+page.svelte -->
<form method="POST" action="?/create">
  <input name="text" placeholder="New todo" />
  <button>Add</button>
</form>

{#each data.todos as todo}
  <div class="todo">
    <form method="POST" action="?/toggle">
      <input type="hidden" name="id" value={todo.id} />
      <button>{todo.done ? '✓' : '○'}</button>
    </form>

    <span class:done={todo.done}>{todo.text}</span>

    <form method="POST" action="?/delete">
      <input type="hidden" name="id" value={todo.id} />
      <button>Delete</button>
    </form>
  </div>
{/each}
```

The `action="?/actionName"` targets a specific action.

## Progressive Enhancement

Without JavaScript, forms do full page reloads. Add `use:enhance` for a better experience:

```svelte
<script>
  import { enhance } from '$app/forms'
</script>

<form method="POST" use:enhance>
  <!-- form fields -->
</form>
```

Now the form:

- Submits without page reload
- Shows pending state
- Updates `form` prop with the result
- Works even if JavaScript fails to load

## Custom Enhancement

Control the enhancement behavior:

```svelte
<script>
  import { enhance } from '$app/forms'

  let loading = false
</script>

<form
  method="POST"
  use:enhance={() => {
    loading = true

    return async ({ result, update }) => {
      loading = false

      if (result.type === 'success') {
        // Custom success handling
        showToast('Saved!')
      }

      // Call update() to apply default behavior
      await update()
    }
  }}
>
  <button disabled={loading}>
    {loading ? 'Saving...' : 'Save'}
  </button>
</form>
```

## Validation

Return errors from actions:

```javascript
// src/routes/signup/+page.server.js
import { fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email");
    const password = data.get("password");

    const errors = {};

    if (!email?.includes("@")) {
      errors.email = "Please enter a valid email";
    }

    if (password?.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(errors).length) {
      return fail(400, {
        errors,
        email, // Return email so the field stays filled
      });
    }

    // Create user...
    await createUser(email, password);

    return { success: true };
  },
};
```

```svelte
<!-- src/routes/signup/+page.svelte -->
<script>
  import { enhance } from '$app/forms'

  export let form
</script>

<form method="POST" use:enhance>
  <div class="field">
    <input
      name="email"
      type="email"
      value={form?.email ?? ''}
      placeholder="Email"
    />
    {#if form?.errors?.email}
      <span class="error">{form.errors.email}</span>
    {/if}
  </div>

  <div class="field">
    <input
      name="password"
      type="password"
      placeholder="Password"
    />
    {#if form?.errors?.password}
      <span class="error">{form.errors.password}</span>
    {/if}
  </div>

  <button>Sign Up</button>
</form>

{#if form?.success}
  <p>Account created! Check your email.</p>
{/if}
```

`fail()` returns a 400 response but keeps the data accessible in `form`.

## Redirects After Actions

```javascript
// src/routes/login/+page.server.js
import { redirect, fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get("email");
    const password = data.get("password");

    const user = await authenticate(email, password);

    if (!user) {
      return fail(401, {
        error: "Invalid credentials",
        email,
      });
    }

    // Set session cookie
    cookies.set("session", user.sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Redirect to dashboard
    throw redirect(303, "/dashboard");
  },
};
```

Use `303` for redirects after POST.

## File Uploads

Handle file uploads:

```svelte
<form method="POST" enctype="multipart/form-data" use:enhance>
  <input type="file" name="avatar" accept="image/*" />
  <button>Upload</button>
</form>
```

```javascript
// +page.server.js
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const file = data.get("avatar");

    if (file.size > 5 * 1024 * 1024) {
      return fail(400, { error: "File too large" });
    }

    const buffer = await file.arrayBuffer();
    const filename = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;

    await saveFile(filename, buffer);

    return { success: true, filename };
  },
};
```

## Comparing to Nuxt

Nuxt uses API routes for form handling:

```vue
<script setup>
async function handleSubmit() {
  await $fetch("/api/contact", {
    method: "POST",
    body: { name, email, message },
  });
}
</script>
```

SvelteKit's approach is more integrated:

- Forms work without JavaScript
- Data and actions live together
- Built-in progressive enhancement

## Practical Example: Complete Auth Form

```javascript
// src/routes/auth/+page.server.js
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/database";
import { hash, verify } from "$lib/server/auth";

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get("email")?.toString().trim();
    const password = data.get("password")?.toString();

    if (!email || !password) {
      return fail(400, {
        action: "login",
        error: "Email and password required",
        email,
      });
    }

    const user = await db.getUserByEmail(email);

    if (!user || !(await verify(password, user.passwordHash))) {
      return fail(401, {
        action: "login",
        error: "Invalid email or password",
        email,
      });
    }

    const session = await db.createSession(user.id);

    cookies.set("session", session.id, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    throw redirect(303, "/dashboard");
  },

  register: async ({ request }) => {
    const data = await request.formData();
    const email = data.get("email")?.toString().trim();
    const password = data.get("password")?.toString();
    const confirmPassword = data.get("confirmPassword")?.toString();

    const errors = {};

    if (!email?.includes("@")) {
      errors.email = "Valid email required";
    }

    if (!password || password.length < 8) {
      errors.password = "Password must be 8+ characters";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length) {
      return fail(400, { action: "register", errors, email });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return fail(400, {
        action: "register",
        errors: { email: "Email already registered" },
        email,
      });
    }

    await db.createUser(email, await hash(password));

    return { action: "register", success: true };
  },
};
```

```svelte
<!-- src/routes/auth/+page.svelte -->
<script>
  import { enhance } from '$app/forms'

  export let form

  let mode = 'login'
</script>

<div class="auth-container">
  <div class="tabs">
    <button
      class:active={mode === 'login'}
      onclick={() => mode = 'login'}
    >
      Login
    </button>
    <button
      class:active={mode === 'register'}
      onclick={() => mode = 'register'}
    >
      Register
    </button>
  </div>

  {#if mode === 'login'}
    <form method="POST" action="?/login" use:enhance>
      {#if form?.action === 'login' && form?.error}
        <div class="error">{form.error}</div>
      {/if}

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form?.action === 'login' ? form?.email ?? '' : ''}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
      />
      <button>Login</button>
    </form>
  {:else}
    {#if form?.action === 'register' && form?.success}
      <p class="success">Account created! Please login.</p>
    {/if}

    <form method="POST" action="?/register" use:enhance>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form?.action === 'register' ? form?.email ?? '' : ''}
      />
      {#if form?.errors?.email}
        <span class="field-error">{form.errors.email}</span>
      {/if}

      <input
        name="password"
        type="password"
        placeholder="Password"
      />
      {#if form?.errors?.password}
        <span class="field-error">{form.errors.password}</span>
      {/if}

      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm Password"
      />
      {#if form?.errors?.confirmPassword}
        <span class="field-error">{form.errors.confirmPassword}</span>
      {/if}

      <button>Register</button>
    </form>
  {/if}
</div>
```

## Key Takeaways

- Form actions live in `+page.server.js` with `export const actions`
- `method="POST"` for default action, `action="?/name"` for named actions
- Forms work without JavaScript (progressive enhancement)
- Add `use:enhance` for no-reload submissions
- Use `fail()` to return validation errors
- Use `redirect()` after successful mutations
- Return data from actions — it's available in `form` prop

Next: [Lesson 17: API Routes](/articles/17-api-routes)
