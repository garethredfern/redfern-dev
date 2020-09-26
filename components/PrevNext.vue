<template>
  <div v-if="prev || next" class="flex justify-between">
    <NuxtLink
      v-if="prev"
      :to="{ name: 'articles-slug', params: { slug: prev.slug } }"
      class="md:-rotate-1"
      :class="linkStyles"
    >
      {{ prev.title }}
    </NuxtLink>
    <span v-else>&nbsp;</span>
    <NuxtLink
      v-if="next"
      :to="{ name: 'articles-slug', params: { slug: next.slug } }"
      class="md:rotate-2"
      :class="linkStyles"
    >
      {{ next.title }}
    </NuxtLink>
    <span v-else>&nbsp;</span>
  </div>
</template>

<script>
export default {
  name: "PrevNext",
  props: {
    prev: {
      type: Object,
      default: null,
    },
    next: {
      type: Object,
      default: null,
    },
  },
  computed: {
    linkStyles() {
      return "bg-yellow-200 px-4 py-1 hover:bg-yellow-300 transform duration-500 ease-in-out hover:-translate-y-1 hover:scale-110 border border-yellow-100 md:transform";
    },
  },
};
</script>
