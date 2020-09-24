<template>
  <div class="container">
    <div class="text-center">
      <h3 v-if="error.statusCode === 404" class="font-bold text-3xl">
        Page not found
      </h3>
      <h3 v-else class="font-bold text-3xl">An error occurred</h3>
      <NuxtLink to="/">Home</NuxtLink>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: null,
    },
  },
  layout: "default",
};
</script>
