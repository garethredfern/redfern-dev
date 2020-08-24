<template>
  <article class="prose prose-lg text-gray-500 mx-auto">
    <p class="text-gray-600">{{ formatDate(article.createdAt) }}</p>
    <nuxt-content :document="article" />
    <footer>
      <prev-next :prev="prev" :next="next" />
    </footer>
  </article>
</template>

<script>
export default {
  async asyncData({ $content, params }) {
    const article = await $content('articles', params.slug).fetch();

    const [prev, next] = await $content('articles')
      .only(['title', 'slug'])
      .sortBy('createdAt', 'asc')
      .surround(params.slug)
      .fetch();

    return {
      article,
      prev,
      next,
    };
  },
  methods: {
    formatDate(date) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString('en', options);
    },
  },
};
</script>
