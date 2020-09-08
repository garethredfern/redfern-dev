<template>
  <div>
    <ul class="text-gray-500 max-w-5xl mx-auto">
      <li
        v-for="article of articles"
        :key="article.slug"
        class="mb-12 bg-white p-5 rounded shadow"
      >
        <NuxtLink
          :to="{ name: 'articles-slug', params: { slug: article.slug } }"
          class="md:grid md:gap-4 md:grid-cols-2"
        >
          <img v-if="article.image" :src="article.image" alt="" class="mb-4" />
          <div>
            <h2 class="font-bold text-gray-900 text-2xl mb-2">
              {{ article.title }}
            </h2>
            <p class="text-lg">{{ article.description }}</p>
            <p class="font-bold text-gray-900 mt-2">
              Read more<span class="text-gray-500">&hellip;</span>
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  async asyncData({ $content, params }) {
    const articles = await $content("articles", params.slug)
      .only(["title", "description", "image", "slug", "published"])
      .sortBy("published", "desc")
      .fetch();

    return {
      articles,
    };
  },
};
</script>
