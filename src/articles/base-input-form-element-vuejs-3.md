---
title: "Create a Base Input Form Element Vue 3"
description: "Let's take a look at how `v-model` has changed in Vue 3 and build a reusable BaseInput text field."
tags: ["vue"]
pubDate: "2020-10-27T09:00:00.000Z"
permalink: "base-input-form-element-vuejs-3"
---

## Create a Base Input Form Element Vue 3

Vue 3 doesn’t come with many breaking changes relating to Vue 2, but due to it being a complete rewrite there have been one or two. These changes do provide more flexibility and power for you to use. Let’s take a look at how `v-model` has changed and build a reusable BaseInput text field.

### The old v-model in Vue 2

- Default v-model prop was `value`
- Default v-model event was `input`

### The new v-model in Vue 3

- Default v-model prop is now `modelValue`
- Default v-model event is now `update:modelValue`

The important thing to note is whatever comes after the colon on the `update:` must match the prop keyword. In this example, `modelValue` is the keyword that must match.

> Vue uses **modelValue** as the default name.

### Creating the BaseInput Component

```js
<template>
  <div>
    <label v-if="label" :for="id" class="font-bold block">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="updateInput"
      class="border w-full p-1"
    />
  </div>
</template>

<script>
export default {
  name: "BaseInput",
  props: {
    id: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    modelValue: {
      type: [String, Number],
      default: "",
    },
    type: {
      type: String,
      default: "text",
    }
  },
  methods: {
    updateInput(event) {
      this.$emit("update:modelValue", event.target.value);
    }
  }
};
</script>
```

### Using the BaseInput Component

Note on the BaseInput that `v-model="email"` is a shorthand for:

```js
v-model:modelValue="email"
```

The `modelValue` relates to the prop on the BaseInput with the same name. You can change this name by using the longhand version:

```js
v-model:myNewValue="email"
```

If you do want to change the name then make sure the prop and update string in your component match:

```js
props: {
  myNewValue: {
    type: String,
    default: "",
 },
methods: {
  updateInput(event) {
	// update:myNewValue must match prop myNewValue
    this.$emit("update:myNewValue", event.target.value);
  },
},
```

Here is the full example of how to use the BaseInput:

```js
<template>
  <BaseInput
    id="email"
    class="mb-4"
    type="email"
    label="email"
    v-model="email"
  />
</template>

<script>
import BaseInput from "./BaseInput.vue";

export default {
  name: "FormComponent",
  components: {
    BaseInput,
  },
  data() {
    return {
      email: "",
    };
  },
  // v-model:modelValue="email"
};
</script>
```
