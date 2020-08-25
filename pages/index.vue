<template>
  <div>
    <ul class="prose prose-lg text-gray-500 mx-auto">
      <li v-for="article of articles" :key="article.slug">
        <NuxtLink
          :to="{ name: 'articles-slug', params: { slug: article.slug } }"
        >
          <h2>{{ article.title }}</h2>
        </NuxtLink>
        <div>
          <img v-if="article.image" :src="article.img" alt="" />
          <p>{{ article.description }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
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
